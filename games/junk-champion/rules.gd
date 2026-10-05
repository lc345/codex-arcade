extends RefCounted

const NAMES = ["BOILER", "TURBINE", "JACKBOX"]
const MAX_ENEMY_HP = [105.0, 95.0, 115.0]
var round_index := 0
var phase := "ready"
var active := true
var time := 0.0
var hp := 100.0
var enemy_hp := 105.0
var guard := 100.0
var held := false
var held_time := 0.0
var stun := 0.0
var swing := 0.0
var swing_hit := false
var swing_counter := false
var swing_length := 0.32
var counter := 0.0
var enemy_phase := "idle"
var enemy_left := 0.8
var enemy_length := 0.8
var attack_hit := false
var chain := 0
var pattern := 0
var score := 0
var hits := 0
var parries := 0
var breaks := 0
var combo := 0
var best_combo := 0
var enemy_recoil := 0.0
var player_recoil := 0.0
var impact := 0.0
var freeze := 0.0
var banner := ""
var banner_left := 0.0
var events: Array[String] = []
var accumulator := 0.0

func _init(index := 0, saved = null) -> void:
	round_index = clampi(index, 0, 2)
	enemy_hp = MAX_ENEMY_HP[round_index]
	if not saved is Dictionary or saved.size() > 12: return
	var required = ["version", "round", "hp", "enemy_hp", "score", "hits", "parries", "pattern", "best_combo", "won"]
	for key in required:
		if not saved.has(key): return
	for key in required.slice(0, 9):
		if not (saved[key] is int or saved[key] is float) or not is_finite(float(saved[key])): return
	if saved.version != 1 or saved.round != int(saved.round) or saved.round < 0 or saved.round > 2: return
	if saved.hp <= 0 or saved.hp > 100 or saved.enemy_hp < 0 or saved.enemy_hp > MAX_ENEMY_HP[int(saved.round)]: return
	if saved.score < 0 or saved.score > 99999 or saved.hits < 0 or saved.hits > 999 or saved.parries < 0 or saved.parries > 999 or saved.pattern < 0 or saved.pattern > 9999 or saved.best_combo < 0 or saved.best_combo > 999: return
	if not saved.won is bool or saved.won != (saved.enemy_hp == 0): return
	round_index = int(saved.round); hp = saved.hp; enemy_hp = saved.enemy_hp
	score = int(saved.score); hits = int(saved.hits); parries = int(saved.parries); pattern = int(saved.pattern); best_combo = int(saved.best_combo)
	phase = "won" if saved.won else "ready"

func emit(kind: String, label := "") -> void:
	events.append(kind)
	if events.size() > 30: events.pop_front()
	if label != "": banner = label; banner_left = 0.65

func press() -> bool:
	if not active or held or phase in ["won", "lost"] or stun > 0 or swing > 0: return false
	phase = "playing"; held = true; held_time = 0.0
	return true

func release() -> bool:
	if not active or not held or phase != "playing": return false
	held = false
	if held_time < 0.025 or stun > 0 or swing > 0: return false
	swing = swing_length; swing_hit = false; swing_counter = counter > 0
	counter = 0.0; emit("swoosh")
	return true

func cancel() -> void:
	held = false; held_time = 0.0

func stop() -> void:
	cancel(); active = false; events.clear()

func resume() -> void:
	active = true; cancel()
	if phase == "playing":
		phase = "ready"; swing = 0.0; enemy_phase = "idle"; enemy_left = 0.8; enemy_length = 0.8; stun = 0.0

func next_round() -> bool:
	if not active or phase != "won" or round_index >= 2: return false
	round_index += 1; hp = 100; enemy_hp = MAX_ENEMY_HP[round_index]; guard = 100
	phase = "ready"; enemy_phase = "idle"; enemy_left = 0.8; enemy_length = 0.8
	swing = 0; counter = 0; pattern = 0; chain = 0; stun = 0; combo = 0; cancel()
	enemy_recoil = 0; player_recoil = 0; impact = 0; freeze = 0; banner = ""; banner_left = 0
	swing_hit = false; swing_counter = false; events.clear()
	return true

func enemy_state(next: String, duration: float) -> void:
	enemy_phase = next; enemy_left = duration; enemy_length = duration
	if next == "strike": attack_hit = false; emit("swoosh")

func positions() -> Vector2:
	var p := 300.0
	var e := 665.0
	if swing > 0: p += sin(clampf((swing_length - swing) / swing_length, 0, 1) * PI) * 100
	if enemy_phase == "strike": e -= sin(clampf((enemy_length - enemy_left) / enemy_length, 0, 1) * PI) * 135
	p -= sin(player_recoil * PI) * 55
	e += sin(enemy_recoil * PI) * 65
	return Vector2(p, e)

func step(delta: float) -> void:
	if not active or phase != "playing" or not is_finite(delta) or delta <= 0: return
	accumulator += minf(delta, 0.05)
	while accumulator >= 1.0 / 120.0:
		accumulator -= 1.0 / 120.0
		advance(1.0 / 120.0)
		if phase != "playing": break

func advance(dt: float) -> void:
	if freeze > 0: freeze = maxf(0, freeze - dt); return
	time += dt
	stun = maxf(0, stun - dt); counter = maxf(0, counter - dt)
	enemy_recoil = maxf(0, enemy_recoil - dt * 3); player_recoil = maxf(0, player_recoil - dt * 3)
	impact = maxf(0, impact - dt * 4); banner_left = maxf(0, banner_left - dt)
	if held:
		held_time += dt; guard = maxf(0, guard - dt * 26)
		if guard == 0: guard_break()
	else: guard = minf(100, guard + dt * 32)
	if swing > 0:
		swing = maxf(0, swing - dt)
		if not swing_hit and swing < swing_length * 0.55 and swing > swing_length * 0.3:
			var pos = positions()
			var glove = Rect2(pos.x + 165, 272, 80, 78)
			var hurtbox = Rect2(pos.y - 92, 195, 184, 235)
			if glove.intersects(hurtbox):
				swing_hit = true
				if enemy_phase == "recover" or swing_counter:
					var damage = 27 if swing_counter else 14
					enemy_hp = maxf(0, enemy_hp - damage); hits += 1; combo += 1; best_combo = maxi(combo, best_combo)
					score += damage * 10 + combo * 15; enemy_recoil = 0.95; impact = 1; freeze = 0.045
					emit("punch", "COUNTER!" if swing_counter else "CLEAN HIT")
					# A counter staggers, but does not erase the next hit of a queued combo.
					if chain == 0: enemy_state("recover" if swing_counter else "idle", 0.62 if swing_counter else 0.5)
				else: emit("block", "COVERED")
	if enemy_hp <= 0:
		phase = "won"; cancel(); emit("bell", "CHAMPION" if round_index == 2 else "KNOCKOUT"); return
	enemy_left -= dt
	if enemy_phase == "strike" and not attack_hit and enemy_left < enemy_length * 0.52:
		var pos = positions()
		if Rect2(pos.y - 225, 272, 95, 90).intersects(Rect2(pos.x - 70, 210, 155, 220)):
			attack_hit = true; receive_hit()
	if hp <= 0: phase = "lost"; cancel(); emit("bell", "BACK TO SCRAP"); return
	if enemy_left <= 0:
		match enemy_phase:
			"idle":
				pattern += 1
				chain = 1 if round_index == 1 else 0
				if round_index == 2 and pattern % 2 == 1: enemy_state("feint", 0.65)
				else: enemy_state("windup", [1.05, 0.68, 0.77][round_index])
			"feint": enemy_state("windup", 0.5)
			"windup": enemy_state("strike", 0.28)
			"strike":
				if chain > 0: chain -= 1; enemy_state("windup", 0.28)
				else: enemy_state("recover", [0.92, 0.75, 0.85][round_index])
			"recover": enemy_state("idle", 0.5)

func guard_break() -> void:
	if stun > 0: return
	breaks += 1; stun = 0.72; cancel(); counter = 0; guard = 15; emit("break", "GUARD BROKEN")

func receive_hit() -> void:
	impact = 1; freeze = 0.045
	if held and stun <= 0 and guard >= 18:
		if held_time <= 0.3:
			parries += 1; guard = minf(100, guard + 18); counter = 0.9; emit("parry", "PERFECT!")
		else:
			guard -= 30; emit("block", "BLOCK")
			if guard < 18: guard_break()
	else:
		hp = maxf(0, hp - [22, 15, 24][round_index]); player_recoil = 0.95
		combo = 0; stun = 0.2; cancel(); emit("hurt", "OUCH!")

func checkpoint() -> Dictionary:
	return {"version":1, "round":round_index, "hp":hp if hp > 0 else 100, "enemy_hp":enemy_hp if hp > 0 else MAX_ENEMY_HP[round_index], "score":score if hp > 0 else 0, "hits":hits if hp > 0 else 0, "parries":parries, "pattern":pattern, "best_combo":best_combo, "won":phase == "won"}

func snapshot() -> Dictionary:
	return {"phase":phase,"active":active,"time":time,"round":round_index,"hp":hp,"enemy_hp":enemy_hp,"guard":guard,"held":held,"enemy_phase":enemy_phase,"enemy_left":enemy_left,"swing":swing,"score":score,"hits":hits,"parries":parries,"breaks":breaks,"banner":banner if banner_left > 0 else "","checkpoint":checkpoint()}
