extends SceneTree

var failures: Array[String] = []
var checks := 0

func check(ok: bool, label: String) -> void:
	checks += 1
	if not ok:
		failures.append(label)
		push_error(label)

func tick(g, seconds: float) -> void:
	for i in range(int(seconds * 120)):
		g.step(1.0 / 120.0)

func play(g, maximum := 70.0) -> void:
	for i in range(int(maximum * 120)):
		if g.phase in ["won", "lost"]: return
		if g.phase == "ready": g.press()
		if g.enemy_phase == "windup" and g.enemy_left < 0.12 and not g.held: g.press()
		if g.enemy_phase == "recover" and g.held: g.release()
		if g.enemy_phase == "idle" and g.held: g.cancel()
		g.step(1.0 / 120.0)

func _initialize() -> void:
	var Rule = load("res://rules.gd")
	if Rule == null:
		push_error("Rules must exist"); quit(1); return
	var g = Rule.new()
	tick(g, 2.0); check(g.phase == "ready" and g.time == 0, "No autoplay")
	check(not g.release(), "Release without press cannot attack")
	g.press(); tick(g, 0.1); g.cancel()
	check(g.swing <= 0 and not g.held, "Cancellation never punches")
	g.press(); tick(g, 15)
	check(g.hp < 100 and g.breaks > 0, "Permanent guard can be broken")
	g = Rule.new(); g.press(); g.cancel(); tick(g, 25)
	check(g.phase == "lost", "Ignoring attacks really loses")
	for round_index in range(3):
		g = Rule.new(round_index); play(g)
		check(g.phase == "won", "Legal inputs win opponent %d" % round_index)
		check(g.hits > 0 and g.score > 0, "Only contacts create score")
		check(g.parries > 0, "Readable timing allows parries")
		var restored = Rule.new(0, g.checkpoint())
		check(restored.phase == "won" and restored.round_index == round_index, "Won checkpoint")
		g.next_round(); check(g.round_index == mini(2, round_index + 1), "Bounded next opponent")
		if round_index < 2:
			check(g.enemy_recoil == 0 and g.player_recoil == 0 and g.banner_left == 0 and g.freeze == 0, "New round clears previous hit pose")
	g = Rule.new()
	for i in range(10800):
		if i % 36 == 0: g.press()
		if i % 36 == 10: g.release()
		g.step(1.0/120.0)
	check(g.phase == "lost", "Blind repeated tapping does not beat the guard: " + JSON.stringify(g.snapshot()))
	g = Rule.new(); g.press(); tick(g, 0.7)
	var cp = g.checkpoint()
	var saved = Rule.new(0, cp)
	check(saved.phase == "ready" and not saved.held and saved.hp == g.hp, "Restore has no held input")
	g.stop(); var frozen = JSON.stringify(g.snapshot()); tick(g, 4)
	check(JSON.stringify(g.snapshot()) == frozen and not g.press() and not g.release(), "Synchronous stop")
	for data in [{"version":1,"round":99}, {"version":1,"hp":10000}, {"version":1,"phase":"won"}, {"version":1,"secret":"private path"}]:
		var invalid = Rule.new(0, data)
		check(invalid.phase == "ready" and invalid.score == 0, "Malformed saves rejected")
	print(JSON.stringify({"checks":checks,"failures":failures}))
	quit(0 if failures.is_empty() else 1)
