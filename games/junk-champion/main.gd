extends Node2D

const Rules = preload("res://rules.gd")
const ATLAS = preload("res://assets/fighters.png")
const ARENA = preload("res://assets/arena.png")
var game = Rules.new()
var world: Node2D
var fighters: Array[Dictionary] = []
var hud: Node2D
var callback
var bridge
var muted := true
var reduced := false
var task_active := false
var paused := false
var pointer := -1
var sounds: Dictionary = {}
var audio: Array[AudioStreamPlayer] = []
var notify_time := 0.0
var last_round := -1

func part(row: int, col: int, parent: Node2D, pos: Vector2, size: Vector2) -> Sprite2D:
	var texture = AtlasTexture.new()
	texture.atlas = ATLAS
	# The painted rows have irregular margins; do not sample the neighbouring rig.
	var tops = [0,318,632,940]
	var heights = [312,309,305,310]
	texture.region = Rect2(col * 320, tops[row], 320, heights[row])
	texture.filter_clip = true
	var sprite = Sprite2D.new(); sprite.texture = texture
	sprite.position = pos; sprite.scale = size / texture.region.size
	parent.add_child(sprite)
	return sprite

func rig(row: int) -> Dictionary:
	var root = Node2D.new(); world.add_child(root)
	var back_leg = part(row, 2, root, Vector2(-43, -67), Vector2(80, 130))
	back_leg.modulate = Color(0.7, 0.78, 0.77)
	var back_arm = Node2D.new(); root.add_child(back_arm)
	var b = part(row, 1, back_arm, Vector2(68, 0), Vector2(195, 175)); b.modulate = Color(0.7, 0.78, 0.77)
	var torso = part(row, 0, root, Vector2(-10, -207), Vector2(200, 243))
	var front_leg = part(row, 2, root, Vector2(22, -66), Vector2(88, 136))
	var arm = Node2D.new(); root.add_child(arm)
	var glove = part(row, 1, arm, Vector2(65, 0), Vector2(210, 185))
	var star = part(row, 3, root, Vector2(97, -194), Vector2(125, 125)); star.visible = false
	return {"root":root,"torso":torso,"arm":arm,"back_arm":back_arm,"glove":glove,"front_leg":front_leg,"back_leg":back_leg,"star":star}

func _ready() -> void:
	world = Node2D.new(); add_child(world)
	var bg = Sprite2D.new(); bg.texture = ARENA; bg.centered = false
	bg.scale = Vector2(960.0 / ARENA.get_width(), 540.0 / ARENA.get_height()); world.add_child(bg)
	fighters.append(rig(0)); fighters.append(rig(1))
	hud = Node2D.new(); add_child(hud); hud.draw.connect(draw_hud)
	for name in ["punch","block","parry","hurt","break","bell","swoosh"]:
		sounds[name] = load("res://assets/" + name + ".wav")
	for i in range(6):
		var player = AudioStreamPlayer.new(); player.volume_db = -8; add_child(player); audio.append(player)
	if OS.has_feature("web"):
		bridge = JavaScriptBridge.get_interface("stageBridge")
		callback = JavaScriptBridge.create_callback(command)
		bridge.register(callback)
	else:
		task_active = true
	update_rigs(); hud.queue_redraw(); publish()

func silence() -> void:
	for player in audio: player.stop()

func sound(name: String) -> void:
	if muted or not task_active or paused: return
	for player in audio:
		if not player.playing:
			player.stream = sounds.get(name); player.play(); break

func publish() -> void:
	if bridge:
		var s = game.snapshot(); s["paused"] = paused; s["task_active"] = task_active
		s["rendering"] = RenderingServer.render_loop_enabled
		s["voices"] = audio.filter(func(player): return player.playing).size()
		bridge.publish(JSON.stringify(s))

func command(args: Array) -> void:
	if args.size() < 1: return
	var type = str(args[0])
	var value = JSON.parse_string(str(args[1])) if args.size() > 1 else null
	match type:
		"settings":
			if value is Dictionary:
				muted = value.get("muted", true) == true; reduced = value.get("reduced", false) == true
				if muted: silence()
		"restore":
			if not task_active: game = Rules.new(0, value)
		"start":
			task_active = true; paused = false; game.resume(); get_tree().paused = false
		"stop":
			task_active = false; paused = false; pointer = -1; game.stop(); silence(); get_tree().paused = true
		"pause":
			paused = value == true; pointer = -1; game.cancel(); silence(); get_tree().paused = paused or not task_active
		"down":
			if task_active and not paused: game.press()
		"up":
			if task_active and not paused: game.release()
		"cancel": game.cancel(); pointer = -1
		"retry":
			if task_active and not paused: game = Rules.new(game.round_index); silence()
		"next":
			if task_active and not paused: game.next_round(); silence()
	# SceneTree pause stops simulation; the renderer needs its own stop signal.
	RenderingServer.render_loop_enabled = task_active and not paused
	update_rigs(); hud.queue_redraw(); publish()

func _input(event: InputEvent) -> void:
	if not task_active or paused: return
	if event is InputEventMouseButton and event.button_index == MOUSE_BUTTON_LEFT:
		if event.pressed: game.press()
		else: game.release()
	if event is InputEventScreenTouch:
		if event.pressed and pointer == -1: pointer = event.index; game.press()
		elif event.index == pointer:
			pointer = -1
			if event.canceled: game.cancel()
			else: game.release()
	if event is InputEventKey and not event.echo:
		if event.keycode == KEY_SPACE:
			if event.pressed: game.press()
			else: game.release()
		elif event.keycode == KEY_R and event.pressed: game = Rules.new(game.round_index)
		elif event.keycode == KEY_ENTER and event.pressed and game.phase == "won": game.next_round()
	publish()

func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_OUT and is_instance_valid(hud):
		game.cancel(); pointer = -1; silence(); publish()

func _process(dt: float) -> void:
	if task_active and not paused: game.step(dt)
	for e in game.events: sound(e)
	game.events.clear()
	update_rigs(); hud.queue_redraw()
	notify_time += dt
	if notify_time > 0.08: notify_time = 0; publish()

func update_rigs() -> void:
	if fighters.size() != 2: return
	if last_round != game.round_index:
		var old = fighters[1].root; world.remove_child(old); old.queue_free()
		fighters[1] = rig(game.round_index + 1); last_round = game.round_index
	var pos = game.positions()
	world.position = Vector2(sin(game.time * 135) * game.impact * 3, cos(game.time * 117) * game.impact * 2) if not reduced and task_active else Vector2.ZERO
	for i in range(2):
		var f = fighters[i]
		var recoil = game.player_recoil if i == 0 else game.enemy_recoil
		var attacking = game.swing > 0 if i == 0 else game.enemy_phase == "strike"
		var windup = false if i == 0 else game.enemy_phase in ["windup","feint"]
		var guarding = game.held if i == 0 else game.enemy_phase == "idle"
		var lost = game.phase == "lost" if i == 0 else game.phase == "won"
		var progress = (game.swing_length-game.swing)/game.swing_length if i == 0 else 1-game.enemy_left/maxf(0.01,game.enemy_length)
		var punch = sin(clampf(progress,0,1)*PI) if attacking else 0.0
		var bob = sin(game.time*6+i)*3 if game.phase=="playing" and not reduced else 0.0
		var direction = 1.0 if i == 0 else -1.0
		var size = 0.93 if i == 0 else [1.12,1.0,1.05][game.round_index]
		f.root.position = Vector2(pos[i], 465+bob)
		f.root.scale = Vector2(direction*size, size)
		f.root.rotation = -direction*0.78 if lost else -direction*sin(recoil*PI)*0.12
		f.torso.rotation = -0.12 if windup else punch*0.12-sin(recoil*PI)*0.16
		f.torso.scale.y = 243.0/f.torso.texture.get_height()*(1.0-punch*.035)
		f.front_leg.rotation = punch*.23; f.back_leg.rotation = -punch*.2
		f.arm.position = Vector2(-5+punch*45, -185-punch*7)
		f.back_arm.position = Vector2(-32,-193)
		f.back_arm.rotation = -0.85 if guarding else -0.3
		f.arm.rotation = lerpf(-0.65,0.0,punch) if attacking else -1.08 if guarding else 0.5 if windup else -0.42
		f.arm.scale.x = 1.0+punch*.14
		f.star.visible = recoil > .5 and not reduced
		f.star.rotation = game.time*3
		f.glove.modulate = Color(1.3,1.15,.7) if i == 0 and game.counter > 0 else Color.WHITE

func label(text: String, at: Vector2, size: int, color := Color("f7edcc"), align := 0) -> void:
	var font = ThemeDB.fallback_font
	var width = font.get_string_size(text, HORIZONTAL_ALIGNMENT_LEFT, -1, size).x
	hud.draw_string(font, at-Vector2(width*align*.5,0), text, HORIZONTAL_ALIGNMENT_LEFT, -1, size, color)

func bar(rect: Rect2, value: float, color: Color, right := false) -> void:
	hud.draw_rect(rect, Color("101b20"))
	var fill = rect.grow(-3); fill.size.x *= clampf(value,0,1)
	if right: fill.position.x = rect.end.x-3-fill.size.x
	hud.draw_rect(fill, color)
	hud.draw_rect(rect, Color("f0e2b7"), false, 2)

func draw_hud() -> void:
	hud.draw_rect(Rect2(0,0,960,87), Color(0.025,0.06,0.065,0.92))
	label("TIN ROOKIE",Vector2(28,30),18,Color("f2cd4c"))
	label(Rules.NAMES[game.round_index],Vector2(932,30),18,Color("f18469"),2)
	bar(Rect2(28,41,305,20),game.hp/100.0,Color("edc74d"))
	bar(Rect2(627,41,305,20),game.enemy_hp/Rules.MAX_ENEMY_HP[game.round_index],Color("ed6652"),true)
	bar(Rect2(28,68,175,7),game.guard/100.0,Color("65cbba"))
	label("%02d / 03"%(game.round_index+1),Vector2(480,33),19,Color("f7edcc"),1)
	label("%05d"%game.score,Vector2(480,65),20,Color("91cbb4"),1)
	if game.phase == "ready":
		hud.draw_rect(Rect2(377,97,206,44),Color("ead046"))
		label("ROUND %d"%(game.round_index+1),Vector2(480,127),23,Color("10242a"),1)
	if game.phase == "playing":
		var cue = {"idle":"", "windup":"!!", "strike":"", "feint":"?", "recover":"OPEN"}[game.enemy_phase]
		var p = game.positions()
		if cue != "":
			hud.draw_circle(Vector2(p.y,143),28,Color("e6cb4f") if cue!="OPEN" else Color("72c3ac"))
			label(cue,Vector2(p.y,151),17 if cue=="OPEN" else 29,Color("12292c"),1)
		if game.counter>0: label("COUNTER",Vector2(p.x,178),17,Color("f8d953"),1)
	if game.banner_left>0:
		var big = game.banner in ["PERFECT!","COUNTER!","GUARD BROKEN"]
		label(game.banner,Vector2(480,155),28 if big else 22,Color("f8d855") if big else Color("eef4de"),1)
	if game.phase in ["won","lost"]:
		hud.draw_rect(Rect2(240,145,480,110),Color(.025,.07,.08,.94))
		label("CHAMPION!" if game.phase=="won" and game.round_index==2 else "KNOCKOUT!" if game.phase=="won" else "BACK TO SCRAP",Vector2(480,191),33,Color("f2cd4c"),1)
		label("%d CLEAN HITS  /  %d PARRIES"%[game.hits,game.parries],Vector2(480,229),16,Color("b4d8cc"),1)
