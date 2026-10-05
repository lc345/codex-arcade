import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const exec=promisify(execFile), root=new URL("../",import.meta.url).pathname;
const engine=process.env.GODOT_BIN||root+".tools/godot/Godot.app/Contents/MacOS/Godot";
const project=root+"games/junk-champion", out=root+"apps/codex-stage/godot-junk/built/";
await mkdir(out,{recursive:true});
await copyFile(project+"/GODOT-LICENSE.txt",out+"GODOT-LICENSE.txt");
await copyFile(project+"/GODOT-COPYRIGHT.txt",out+"GODOT-COPYRIGHT.txt");
const template=await readFile(root+".tools/godot/web_nothreads_release.zip");
if(createHash("sha256").update(template).digest("hex")!=="5f202410b79f15d31bfef4c434ee7b7bcc964b50a587bb1338cb53ad9d94c61b")throw new Error("Unexpected Godot Web template digest");
for(const args of [["--editor","--import","--quit"],["--script","tests.gd"],["--export-release","Web",out+"game.html"]]){
  const {stdout,stderr}=await exec(engine,["--headless","--path",project,"--log-file",root+"output/junk-godot-build.log",...args],{maxBuffer:4*1024*1024});
  if(/SCRIPT ERROR|Parse Error|Failed to load script|Export failed/i.test(stdout+stderr))throw new Error(stdout+stderr);
  process.stdout.write(stdout);process.stderr.write(stderr);
}
const files=[];
for(const name of ["game.html","game.js","game.wasm","game.pck"]){const data=await readFile(out+name);files.push({name,bytes:data.length,sha256:createHash("sha256").update(data).digest("hex")});}
const assets=[];
for(const name of ["arena.png","fighters.png","punch.wav","parry.wav","block.wav","hurt.wav","break.wav","bell.wav","swoosh.wav"]){const data=await readFile(project+"/assets/"+name);assets.push({name,bytes:data.length,sha256:createHash("sha256").update(data).digest("hex")});}
await writeFile(out+"manifest.json",JSON.stringify({id:"junk-champion",engine:"Godot 4.5.2",threaded:false,offline:true,permissions:[],files,assets},null,2)+"\n");
console.log(JSON.stringify({files,totalBytes:files.reduce((n,f)=>n+f.bytes,0)}));
