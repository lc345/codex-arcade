"""Original clay shopper, wire cart and seaside set; Blender background builder."""
import bpy
import json
import math
import os
import random

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '../..'))
OUT = os.path.join(ROOT, 'apps/codex-stage/cart-downhill/assets')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(41)

def mat(name, color, metal=0, rough=.7):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m

steel=mat('Brushed metal',(.53,.65,.68),.72,.32)
red=mat('Tomato enamel',(.88,.095,.06),.12,.48)
blue=mat('Woven indigo',(.065,.29,.58))
skin=mat('Warm terracotta clay',(.83,.47,.28),0,.92)
white=mat('Chalk',(.94,.96,.89))
rubber=mat('Soft rubber',(.035,.05,.08))
pink=mat('Raspberry icing',(.91,.23,.42))
yellow=mat('Lemon clay',(.99,.72,.10))
wood=mat('Painted wood',(.36,.57,.43))
orange=mat('Orange peel',(.97,.29,.035))
glass=mat('Painted blue windows',(.10,.38,.43),.2,.22)
wall=mat('Turquoise plaster',(.24,.68,.65))
roof=mat('Coral roof tiles',(.8,.20,.15))

def pos(v): return (v[0],-v[2],v[1])
def group(name,parent=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o)
    o.parent=parent
    return o

def shape(name,at,size,m,parent,kind='box',bevel=.06):
    if kind=='ball': bpy.ops.mesh.primitive_uv_sphere_add(segments=20,ring_count=12,location=pos(at))
    elif kind=='cylinder': bpy.ops.mesh.primitive_cylinder_add(vertices=20,radius=1,depth=2,location=pos(at))
    else: bpy.ops.mesh.primitive_cube_add(size=2,location=pos(at))
    o=bpy.context.object;o.name=name;o.scale=(size[0],size[2],size[1])
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if kind=='box' and bevel:
        b=o.modifiers.new('Rounded handmade edge','BEVEL');b.width=bevel;b.segments=3;bpy.ops.object.modifier_apply(modifier=b.name)
    if kind=='ball':
        for v in o.data.vertices: v.co*=1+random.uniform(-.012,.012)
    for p in o.data.polygons:p.use_smooth=True
    o.data.materials.append(m);o.parent=parent
    return o

def rod(name,a,b,r,m,parent):
    from mathutils import Vector
    av,bv=Vector(pos(a)),Vector(pos(b))
    bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=r,depth=(bv-av).length,location=(av+bv)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=(bv-av).to_track_quat('Z','Y').to_euler();o.parent=parent;o.data.materials.append(m)
    for p in o.data.polygons:p.use_smooth=True
    return o

cart=group('Cart')
shape('Base',(0,0,0),(.67,.10,.9),steel,cart)
for y in [.30,.77]:
    for x in [-.64,.64]:rod('BasketRim',(x,y,-.82),(x,y,.82),.029,steel,cart)
    for z in [-.82,.82]:rod('BasketRim',(-.64,y,z),(.64,y,z),.029,steel,cart)
for x in [-.64,.64]:
    for j in range(10):rod('BasketWire',(x,.3,-.8+j*.177),(x,.77,-.8+j*.177),.009,steel,cart)
for z in [-.82,.82]:
    for j in range(9):rod('BasketWire',(-.62+j*.155,.3,z),(-.62+j*.155,.77,z),.009,steel,cart)
for j in range(9):rod('BasketFloor',(-.6+j*.15,.3,-.8),(-.6+j*.15,.3,.8),.012,steel,cart)
for x in [-.64,.64]:rod('HandlePost',(x,0,.66),(x,1.03,1.12),.035,steel,cart)
rod('RedGrip',(-.72,1.03,1.12),(.72,1.03,1.12),.06,red,cart)
shape('Badge',(0,.58,-.84),(.23,.12,.035),red,cart)
for side in [-1,1]:
    for z in [-.66,.66]:
        wh=group('Wheel_'+str(side)+'_'+str(z))
        o=shape('Tire',(0,0,0),(.23,.1,.23),rubber,wh,'cylinder');o.rotation_euler.y=math.pi/2
        o=shape('Hub',(0,0,0),(.12,.105,.12),white,wh,'cylinder');o.rotation_euler.y=math.pi/2
        wh.location=pos((side*.65,-.44,z));wh.parent=cart

person=group('Shopper')
body=group('Body',person)
shape('Dungarees',(0,1.0,1.4),(.33,.45,.24),blue,body,'ball')
shape('Shirt',(0,1.38,1.38),(.36,.25,.26),white,body,'ball')
shape('ApronBib',(0,1.32,1.65),(.23,.25,.055),blue,body)
shape('Pocket',(0,1.04,1.65),(.17,.105,.036),red,body)
for x in [-.19,.19]:
    rod('Strap',(x,1.14,1.69),(x,1.6,1.55),.035,blue,body)
    shape('Button',(x,1.37,1.69),(.026,.026,.014),yellow,body,'ball')
head=group('Head',body);head.location=pos((0,1.83,1.3))
shape('Face',(0,0,0),(.30,.33,.27),skin,head,'ball')
shape('Nose',(0,-.01,-.27),(.075,.08,.09),skin,head,'ball')
for x in [-.115,.115]:
    shape('Eye',(x,.045,-.25),(.064,.073,.035),white,head,'ball')
    shape('Pupil',(x,.05,-.281),(.025,.035,.018),rubber,head,'ball')
shape('Cap',(0,.24,.015),(.32,.14,.29),red,head,'ball')
shape('CapPeak',(0,.19,-.26),(.32,.025,.22),red,head)
for x,side in [(-.19,'L'),(.19,'R')]:
    leg=group('Leg'+side,person);leg.location=pos((x,.55,1.42))
    shape('Trouser',(0,-.52,0),(.13,.50,.15),blue,leg,'ball')
    shape('Shoe',(0,-1.10,-.10),(.16,.12,.27),yellow,leg,'ball')
    shape('Sole',(0,-1.18,-.10),(.17,.04,.27),white,leg)
for x in [-.32,.32]:
    rod('Sleeve',(x,1.43,1.4),(x*1.5,1.18,1.17),.12,white,body)
    rod('Forearm',(x*1.5,1.18,1.17),(x*1.8,1.02,1.06),.082,skin,body)
    shape('Mitten',(x*1.8,1.02,1.06),(.1,.08,.12),skin,body,'ball')

cake=group('Cake')
shape('Tray',(0,-.23,0),(.45,.028,.45),white,cake,'cylinder')
shape('Sponge',(0,-.03,0),(.39,.20,.39),yellow,cake,'cylinder')
shape('Icing',(0,.16,0),(.405,.055,.405),pink,cake,'cylinder')
for i in range(12):
    a=i*math.tau/12
    shape('Cream',(math.cos(a)*.34,.23,math.sin(a)*.34),(.066,.07,.066),white,cake,'ball')
for x in [-.15,0,.15]:
    rod('Candle',(x,.22,0),(x,.46,0),.018,blue,cake)
    shape('Flame',(x,.49,0),(.022,.043,.022),yellow,cake,'ball')

crate=group('Crate')
for y in [-.21,0,.21]:
    for z in [-.29,.29]:shape('Slat',(0,y,z),(.29,.075,.025),wood,crate,bevel=.012)
    for x in [-.29,.29]:shape('Slat',(x,y,0),(.025,.075,.29),wood,crate,bevel=.012)
shape('Bottom',(0,-.28,0),(.29,.025,.29),wood,crate,bevel=.012)
fruit=group('Orange');shape('Peel',(0,0,0),(.27,.27,.27),orange,fruit,'ball');shape('Leaf',(.035,.26,0),(.08,.012,.035),wood,fruit,'ball')

car=group('TrafficCar')
shape('CarBody',(0,0,0),(1.35,.38,.8),yellow,car,bevel=.25)
shape('Cabin',(-.15,.48,0),(.68,.35,.69),red,car,bevel=.25)
for z in [-.696,.696]:shape('Window',(-.14,.5,z),(.56,.22,.015),glass,car,bevel=.08)
for x in [-.86,.82]:
    for z in [-.76,.76]:
        o=shape('Tire',(x,-.33,z),(.3,.13,.3),rubber,car,'cylinder');o.rotation_euler.x=math.pi/2
        o=shape('Hub',(x,-.33,z*1.13),(.14,.015,.14),white,car,'cylinder');o.rotation_euler.x=math.pi/2
for z in [-.51,.51]:shape('Headlight',(1.34,.05,z),(.04,.12,.17),white,car,'ball')

stall=group('Stall')
shape('Counter',(0,1,0),(1.45,.14,.7),wood,stall)
for x in [-1.32,1.32]:
    for z in [-.58,.58]:rod('Pole',(x,0,z),(x,2.6,z),.045,white,stall)
for j in range(8):shape('Awning',(-1.4+j*.4,2.5,0),(.20,.075,.93),red if j%2 else white,stall,bevel=.04)
for j in range(12):shape('Produce',(-1+j%6*.4,1.3,-.3+int(j/6)*.45),(.16,.16,.16),orange if j%2 else yellow,stall,'ball')

house=group('House')
shape('Plaster',(0,3,0),(2.15,3,2.05),wall,house,bevel=.18)
shape('Cornice',(0,5.9,0),(2.28,.14,2.17),white,house)
for y in [1.7,4.3]:
    for x in [-1.06,1.06]:
        shape('WindowFrame',(x,y,2.07),(.63,.8,.045),white,house)
        shape('Window',(x,y,2.13),(.50,.68,.015),glass,house)
        rod('Mullion',(x,y-.7,2.16),(x,y+.7,2.16),.03,white,house)
        shape('WindowBox',(x,y-.78,2.3),(.64,.11,.22),roof,house)
for i in range(10):
    for side in [-1,1]:
        a=shape('RoofTile',(-2.2+i*.49,6.2,side*1.1),(.27,.12,1.30),roof,house,bevel=.11);a.rotation_euler.x=side*.19
shape('Chimney',(1.2,6.7,-.6),(.3,.65,.32),white,house)

# Join static meshes by material within each semantic part; keep limbs/wheels addressable.
for parent in [o for o in bpy.data.objects if o.type=='EMPTY']:
    by_material={}
    for child in list(parent.children):
        if child.type=='MESH':by_material.setdefault(child.data.materials[0].name,[]).append(child)
    for name,objs in by_material.items():
        if len(objs)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs:o.select_set(True)
        bpy.context.view_layer.objects.active=objs[0];bpy.ops.object.join();bpy.context.object.name=parent.name+'_'+name
bpy.context.preferences.filepaths.save_version = 0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'seaside.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'seaside.glb'),export_format='GLB',export_animations=False)
print('CART_ASSETS_READY',json.dumps({'tool': 'Blender '+bpy.app.version_string}))
