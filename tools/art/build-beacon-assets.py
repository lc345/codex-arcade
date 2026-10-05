"""Original articulated survivor and equipment for Last Beacon. Blender source."""
import bpy
import os
import math
import json
from mathutils import Vector

ROOT=os.path.abspath(os.path.join(os.path.dirname(__file__),'../..'))
OUT=os.path.join(ROOT,'apps/codex-stage/last-beacon/assets')
os.makedirs(OUT,exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def mat(name,c,metal=0,rough=.8):
    m=bpy.data.materials.new(name);m.diffuse_color=(*c,1);m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=(*c,1);p.inputs['Metallic'].default_value=metal;p.inputs['Roughness'].default_value=rough
    return m
fabric=mat('Field fabric',(.19,.25,.19));pants=mat('Slate canvas',(.25,.30,.31));vest=mat('Ballistic panels',(.08,.12,.105));skin=mat('Skin',(.58,.38,.24));black=mat('Rubber',(.027,.036,.04));steel=mat('Parkerized steel',(.13,.17,.18),.65,.4);strap=mat('Webbing',(.35,.39,.27));glass=mat('Goggles',(.09,.23,.25),.6,.23);red=mat('Medical red',(.65,.08,.045));white=mat('Painted markings',(.82,.86,.82));brass=mat('Brass',(.62,.43,.14),.8,.28)
def pos(v):return (v[0],-v[2],v[1])
def group(name,parent=None,at=(0,0,0)):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.parent=parent;o.location=pos(at);return o
def shape(name,at,size,m,parent,kind='box',bevel=.02):
    if kind=='ball':bpy.ops.mesh.primitive_uv_sphere_add(segments=16,ring_count=10,location=pos(at))
    elif kind=='cylinder':bpy.ops.mesh.primitive_cylinder_add(vertices=12,radius=1,depth=2,location=pos(at))
    else:bpy.ops.mesh.primitive_cube_add(size=2,location=pos(at))
    o=bpy.context.object;o.name=name;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if kind=='box' and bevel:
        mod=o.modifiers.new('Manufactured edge','BEVEL');mod.width=bevel;mod.segments=2;bpy.ops.object.modifier_apply(modifier=mod.name)
    o.data.materials.append(m);o.parent=parent
    for p in o.data.polygons:p.use_smooth=kind=='ball'
    return o
def rod(name,a,b,r,m,parent):
    av,bv=Vector(pos(a)),Vector(pos(b));bpy.ops.mesh.primitive_cylinder_add(vertices=10,radius=r,depth=(bv-av).length,location=(av+bv)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=(bv-av).to_track_quat('Z','Y').to_euler();o.data.materials.append(m);o.parent=parent;return o

soldier=group('Survivor')
hip=group('Hip',soldier,at=(0,.89,0));shape('Waist',(0,0,0),(.23,.12,.14),pants,hip)
upper=group('Upper',hip,at=(0,.05,0))
shape('Jacket',(0,.28,0),(.25,.31,.15),fabric,upper,bevel=.08)
shape('Carrier',(0,.30,-.13),(.235,.27,.05),vest,upper,bevel=.04)
for x in [-.145,0,.145]:shape('Magazine pouch',(x,.17,-.2),(.055,.12,.03),strap,upper,bevel=.008)
for y in [.36,.40,.44]:shape('Molle',(0,y,-.19),(.2,.008,.007),strap,upper,bevel=0)
shape('Pack',(0,.25,.19),(.20,.27,.10),strap,upper,bevel=.06)
for x in [-.2,.2]:rod('Shoulder strap',(x,.51,-.12),(x,.07,-.17),.025,strap,upper)
head=group('Head',upper,at=(0,.69,-.015))
shape('Face',(0,0,0),(.128,.155,.12),skin,head,'ball')
shape('Nose',(0,-.005,-.124),(.035,.035,.034),skin,head,'ball')
shape('Helmet',(0,.085,.005),(.164,.125,.152),fabric,head,'ball')
shape('Helmet edge',(0,.048,0),(.165,.018,.156),black,head,bevel=.05)
shape('Visor',(0,.018,-.119),(.122,.032,.036),glass,head,bevel=.025)
rod('Chin strap',(-.13,-.07,0),(0,-.151,-.06),.012,black,head)
rod('Chin strap',(.13,-.07,0),(0,-.151,-.06),.012,black,head)
for x in [-.27,.27]:
    rod('Sleeve',(x,.47,0),(x*1.16,.22,-.14),.087,fabric,upper)
    rod('Forearm',(x*1.16,.22,-.14),(.10 if x>0 else -.02,.24,-.48 if x<0 else -.30),.066,fabric,upper)
    shape('Glove',(.10 if x>0 else -.02,.24,-.48 if x<0 else -.30),(.06,.053,.068),black,upper,'ball')
for side,x in [('L',-.13),('R',.13)]:
    leg=group('Leg'+side,hip,at=(x,-.04,0));shape('Thigh',(0,-.19,0),(.10,.22,.11),pants,leg,bevel=.055)
    shape('Cargo pocket',(x/abs(x)*.09,-.15,.015),(.025,.095,.10),fabric,leg)
    shin=group('Shin'+side,leg,at=(0,-.40,0));shape('Lower leg',(0,-.14,0),(.078,.17,.09),pants,shin,bevel=.04)
    shape('Knee pad',(0,.01,-.095),(.074,.075,.025),black,shin,bevel=.03)
    shape('Boot',(0,-.30,-.046),(.095,.075,.16),black,shin,bevel=.04)
    shape('Sole',(0,-.365,-.046),(.098,.018,.164),steel,shin,bevel=.015)
group('GunSocket',upper,at=(.08,.26,-.35))

for name,long,stock in [('Rifle',.73,True),('Pistol',.24,False),('Scatter',.81,True)]:
    g=group(name)
    shape('Receiver',(0,0,-.10),(.036,.055,.16 if stock else .10),steel,g,bevel=.01)
    shape('Grip',(0,-.075,.015),(.029,.09,.044),black,g,bevel=.01)
    if stock:
        shape('Butt',(0,-.006,.22),(.035,.07,.13),black,g)
        shape('Handguard',(0,.005,-.34),(.043,.055,.15),fabric,g,bevel=.012)
        shape('Magazine',(0,-.1,-.13),(.025,.11,.045),black,g)
        for z in [-.42,-.36,-.30]:shape('Rail',(0,.068,z),(.046,.009,.014),steel,g,bevel=0)
        shape('Sight',(0,.09,-.12),(.017,.023,.033),black,g,bevel=.005)
    rod('Barrel',(0,.025,-.20),(0,.025,-long),.019 if name!='Scatter' else .026,steel,g)
    shape('Muzzle',(0,.025,-long),(.025,.025,.04),black,g,kind='ball')

for name,m in [('AmmoBox',strap),('MedicalCase',red)]:
    g=group(name);shape('Case',(0,.15,0),(.28,.15,.21),m,g,bevel=.03)
    shape('Lid',(0,.30,0),(.29,.025,.22),m,g)
    for x in [-.18,.18]:shape('Latch',(x,.27,-.215),(.023,.05,.01),steel,g,bevel=.003)
    rod('Handle',(-.09,.35,0),(.09,.35,0),.025,black,g)
    if name=='MedicalCase':
        shape('Cross',(0,.327,0),(.13,.003,.035),white,g,bevel=0);shape('Cross',(0,.329,0),(.035,.003,.13),white,g,bevel=0)
    else:
        for x in [-.10,0,.10]:shape('Cartridge',(x,.39,0),(.021,.075,.021),brass,g,'cylinder')

for parent in [o for o in bpy.data.objects if o.type=='EMPTY']:
    groups={}
    for child in list(parent.children):
        if child.type=='MESH':groups.setdefault(child.data.materials[0].name,[]).append(child)
    for material,objects in groups.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();bpy.context.object.name=parent.name+'_'+material
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT,'survivor.blend'))
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'survivor.glb'),export_format='GLB',export_animations=False)
print('BEACON_ASSETS_READY',json.dumps({'tool':'Blender '+bpy.app.version_string}))
