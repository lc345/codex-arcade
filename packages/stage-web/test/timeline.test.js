import assert from "node:assert/strict";
import test from "node:test";

import { renderTimelineFrame, timelineElapsed } from "../src/timeline.js";

const timeline = {
  durationMs: 1200,
  tracks: [
    { atMs: 0, command: "spawn", id: "envelope", kind: "envelope", anchor: "actor" },
    { atMs: 100, command: "path", id: "envelope", from: "actor", to: "recipient", arc: 0.24, durationMs: 800 },
    { atMs: 960, command: "text", id: "caption", text: "Lina Zhang", anchor: "recipient" },
  ],
};

test("mail-flight moves a spawned envelope along a curved path toward the recipient", () => {
  const frame = renderTimelineFrame(timeline, 500, { width: 900, height: 460 });
  const envelope = frame.objects.find((item) => item.id === "envelope");

  assert.ok(envelope.x > frame.anchors.actor.x);
  assert.ok(envelope.x < frame.anchors.recipient.x);
  assert.ok(envelope.y < frame.anchors.actor.y);
  assert.equal(frame.text.length, 0);
});

test("mail-flight exposes its privacy-filtered recipient caption only at its scheduled beat", () => {
  const frame = renderTimelineFrame(timeline, 1100, { width: 900, height: 460 });

  assert.equal(frame.text[0].text, "Lina Zhang");
  assert.equal(frame.text[0].anchor, "recipient");
});

test("reduced-motion renders the final semantic frame without animating a path", () => {
  const frame = renderTimelineFrame(timeline, 120, { width: 900, height: 460, reducedMotion: true });
  const envelope = frame.objects.find((item) => item.id === "envelope");

  assert.equal(envelope.x, frame.anchors.recipient.x);
  assert.equal(envelope.y, frame.anchors.recipient.y);
});

test("a Scene Pack can use a detached comet and portal on the same stage", () => {
  const frame = renderTimelineFrame({
    durationMs: 1000,
    tracks: [
      { atMs: 0, command: "spawn", id: "portal", kind: "portal", anchor: "center" },
      { atMs: 0, command: "spawn", id: "packet", kind: "comet", anchor: "actor" },
      { atMs: 80, command: "path", id: "packet", from: "actor", to: "recipient", arc: -0.34, durationMs: 720 },
    ],
  }, 440, { width: 1000, height: 500 });

  assert.deepEqual(frame.objects.map((object) => object.kind), ["portal", "comet"]);
  assert.notEqual(frame.objects[1].x, frame.anchors.actor.x);
});

test("new action scenes can stage distinct semantic objects", () => {
  const frame = renderTimelineFrame({
    durationMs: 900,
    tracks: [
      { atMs: 0, command: "spawn", id: "phone", kind: "phone", anchor: "actor" },
      { atMs: 0, command: "spawn", id: "calendar", kind: "calendar", anchor: "center" },
      { atMs: 0, command: "spawn", id: "rocket", kind: "rocket", anchor: "recipient" },
    ],
  }, 120);

  assert.deepEqual(frame.objects.map((object) => object.kind), ["phone", "calendar", "rocket"]);
});

test("community scenes can compose detached neon objects without coupling them to the confirmation control", () => {
  const frame = renderTimelineFrame({
    durationMs: 1000,
    tracks: [
      { atMs: 0, command: "spawn", id: "courier", kind: "drone", anchor: "actor" },
      { atMs: 0, command: "spawn", id: "gate", kind: "vault", anchor: "recipient" },
      { atMs: 100, command: "path", id: "courier", from: "actor", to: "recipient", arc: 0.32, durationMs: 600 },
      { atMs: 220, command: "particle", id: "trail", anchor: "center" },
    ],
  }, 480, { width: 960, height: 500 });

  assert.deepEqual(frame.objects.map((object) => object.kind), ["drone", "vault"]);
  assert.equal(frame.particles[0].anchor, "center");
  assert.notEqual(frame.objects[0].x, frame.anchors.actor.x);
});

test("narrative tracks can compose a story around the stage without routing an object to a recipient", () => {
  const frame = renderTimelineFrame({
    durationMs: 1600,
    tracks: [
      { atMs: 0, command: "spawn", id: "seed", kind: "seed", anchor: "center" },
      { atMs: 0, command: "spawn", id: "clock", kind: "clock", anchor: "top" },
      { atMs: 80, command: "orbit", id: "seed", anchor: "center", radius: 0.24, turns: 1, durationMs: 1200 },
      { atMs: 140, command: "pulse", id: "seed", to: 1.4, count: 2, durationMs: 1000 },
      { atMs: 160, command: "rotate", id: "clock", turns: 1.5, durationMs: 1000 },
      { atMs: 220, command: "shake", id: "clock", amplitude: 10, durationMs: 640 },
    ],
  }, 700, { width: 1000, height: 560 });

  const seed = frame.objects.find((item) => item.id === "seed");
  const clock = frame.objects.find((item) => item.id === "clock");

  assert.ok(seed.x !== frame.anchors.center.x || seed.y !== frame.anchors.center.y);
  assert.ok(seed.scale > 1);
  assert.ok(clock.rotation > 0);
  assert.notEqual(clock.y, frame.anchors.top.y);
  assert.equal(frame.anchors.top.x, 500);
});

test("looping activity chapters repeat their visual beat without inventing progress", () => {
  const timeline = {
    durationMs: 800,
    loop: true,
    tracks: [{ atMs: 0, command: "spawn", id: "beacon", kind: "beacon", anchor: "center" }],
  };

  assert.equal(timelineElapsed(timeline, 1_650), 50);
  assert.equal(timelineElapsed({ ...timeline, loop: false }, 1_650), 800);
});
