// Run with the macOS built-in JXA host. No browser or compiler installation.
ObjC.import("Cocoa");
ObjC.import("WebKit");
ObjC.import("CoreGraphics");

function findCodexWindow(front, windows) {
  if (!front || front.bundleId !== "com.openai.codex" || front.hidden || !(front.pid > 0)) return null;
  for (var i = 0; i < windows.length; i++) {
    var w = windows[i], b = w.bounds;
    if (w.pid !== front.pid || w.layer !== 0 || !w.onScreen || !(w.alpha > 0) || !b) continue;
    if (![b.x, b.y, b.width, b.height].every(function (n) { return typeof n === "number" && isFinite(n); })) continue;
    if (b.width >= 400 && b.height >= 240) return b;
  }
  return null;
}

function toAppKitWindowBounds(bounds, desktopTop) {
  return { x: bounds.x, y: desktopTop - bounds.y - bounds.height, width: bounds.width, height: bounds.height };
}

function anchorGameWindowFrame(screens, host, ratio) {
  if (!host) return null;
  var area = 0, best = null, index = -1;
  screens.forEach(function (screen, i) {
    var left = Math.max(screen.x, host.x), bottom = Math.max(screen.y, host.y);
    var width = Math.min(screen.x + screen.width, host.x + host.width) - left;
    var height = Math.min(screen.y + screen.height, host.y + host.height) - bottom;
    if (width > 120 && height > 120 && width * height > area) { area = width * height; best = { x: left, y: bottom, width: width, height: height }; index = i; }
  });
  if (!best) return null;
  var frame = chooseGameWindowFrame([best], { x: best.x, y: best.y }, ratio);
  frame.screenIndex = index; return frame;
}

function gameWindowMode(state, anchor, dismissed) {
  if (!state.fresh || !state.active || state.paused) return "stopped";
  if (state.epoch && state.epoch === dismissed) return "dismissed";
  return anchor ? "visible" : "hidden";
}

function readOnscreenWindows(pid) {
  var list = $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, $.kCGNullWindowID), result = [];
  if (!list) return result;
  // JXA manages this bridged result; CFRelease here double-releases it.
  for (var i = 0; i < $.CFArrayGetCount(list); i++) {
      var row = ObjC.castRefToObject($.CFArrayGetValueAtIndex(list, i));
      // Never read window names, accessibility content or pixels from the host.
      if (Number(ObjC.unwrap(row.objectForKey($("kCGWindowOwnerPID")))) !== pid) continue;
      var b = ObjC.deepUnwrap(row.objectForKey($("kCGWindowBounds")));
      result.push({ pid: pid, layer: Number(ObjC.unwrap(row.objectForKey($("kCGWindowLayer")))), onScreen: Boolean(ObjC.unwrap(row.objectForKey($("kCGWindowIsOnscreen")))), alpha: Number(ObjC.unwrap(row.objectForKey($("kCGWindowAlpha")))), bounds: { x: b.X, y: b.Y, width: b.Width, height: b.Height } });
  }
  return result;
}

function observedWindowBounds(report, pid, now) {
  if (!report || report.pid !== pid || !isFinite(report.updatedAt) || now - report.updatedAt < 0 || now - report.updatedAt > 750) return null;
  return findCodexWindow({ bundleId: "com.openai.codex", pid: pid }, [{ pid: pid, layer: 0, onScreen: true, alpha: 1, bounds: report.bounds }]);
}

// WindowServer queries are synchronous. Keep their latency off the input/event thread.
function runGeometryObserver(statePath) {
  var observerApp = $.NSApplication.sharedApplication;
  observerApp.setActivationPolicy($.NSApplicationActivationPolicyProhibited);
  function observe() {
    try {
      var request = JSON.parse(ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError($(statePath + ".geometry-request"), $.NSUTF8StringEncoding, null)));
      if (request.pid > 0 && request.pid === Math.floor(request.pid) && Date.now() - request.updatedAt >= 0 && Date.now() - request.updatedAt < 2000) {
        var before = Date.now(), windows = readOnscreenWindows(request.pid);
        var bounds = findCodexWindow({ bundleId: "com.openai.codex", pid: request.pid }, windows);
        $(JSON.stringify({ pid: request.pid, bounds: bounds, updatedAt: Date.now(), queryMs: Date.now() - before })).writeToFileAtomicallyEncodingError($(statePath + ".geometry"), true, $.NSUTF8StringEncoding, null);
      }
    } catch (_) {}
  }
  ObjC.registerSubclass({ name: "AgentStageGeometryTicker", superclass: "NSObject", methods: { "tick:": { types: ["void", ["id"]], implementation: observe } } });
  var observer = $.AgentStageGeometryTicker.alloc.init;
  $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(0.2, observer, "tick:", $(), true);
  observerApp.run;
}

function chooseGameWindowFrame(screens, pointer, ratio) {
  var index = screens.findIndex(function (s) { return pointer.x >= s.x && pointer.x < s.x + s.width && pointer.y >= s.y && pointer.y < s.y + s.height; });
  if (index < 0) index = 0;
  var screen = screens[index];
  if (typeof ratio !== "number" || !isFinite(ratio) || ratio < 0.5 || ratio > 3) ratio = 16 / 9;
  var width = Math.min(400, screen.width - 40, (screen.height - 40) * ratio);
  var height = Math.round(width / ratio);
  return { screenIndex: index, x: screen.x + screen.width - width - 20, y: screen.y + 20, width: width, height: height };
}

function isGameWindowVisible(ordered, onActiveSpace, occlusion) {
  return Boolean(ordered && onActiveSpace && (occlusion & 2));
}

function run(argv) {
  var statePath = argv[0];
  if (!statePath) throw new Error("Expected the private Agent Stage window state path");
  if (argv[1] === "--observe") return runGeometryObserver(statePath);
  var app = $.NSApplication.sharedApplication;
  app.setActivationPolicy($.NSApplicationActivationPolicyAccessory);
  // Borderless panels need to opt in to keyboard input after a game click.
  ObjC.registerSubclass({ name: "AgentStageGamePanel", superclass: "NSPanel", methods: { canBecomeKeyWindow: { types: ["bool", []], implementation: function () { return true; } } } });
  var rect = $.NSMakeRect(0, 0, 400, 225);
  var win = $.AgentStageGamePanel.alloc.initWithContentRectStyleMaskBackingDefer(rect, $.NSWindowStyleMaskBorderless | $.NSWindowStyleMaskNonactivatingPanel, $.NSBackingStoreBuffered, false);
  win.title = "Agent Stage";
  win.releasedWhenClosed = false;
  win.level = $.NSFloatingWindowLevel;
  win.hidesOnDeactivate = false;
  win.floatingPanel = true;
  win.becomesKeyOnlyIfNeeded = true;
  // Full-screen eligibility does not grant visibility: the Codex foreground gate below does.
  win.collectionBehavior = $.NSWindowCollectionBehaviorCanJoinAllSpaces | $.NSWindowCollectionBehaviorFullScreenAuxiliary | $.NSWindowCollectionBehaviorCanJoinAllApplications | $.NSWindowCollectionBehaviorTransient;
  win.hasShadow = true;
  var config = $.WKWebViewConfiguration.alloc.init;
  // A document that finishes loading after focus changed starts suspended.
  config.userContentController.addUserScript($.WKUserScript.alloc.initWithSourceInjectionTimeForMainFrameOnly($("window.__agentStageHostVisible=false;window.__agentStageNativeWindow=true;"), $.WKUserScriptInjectionTimeAtDocumentStart, true));
  var profiling = argv[1] === "--qa" && argv[3] === "--profile";
  var nativeInputQA = profiling && argv.indexOf("--native-input") >= 0;
  if (nativeInputQA) config.userContentController.addUserScript($.WKUserScript.alloc.initWithSourceInjectionTimeForMainFrameOnly($("window.__agentStageNativeInput=true;"), $.WKUserScriptInjectionTimeAtDocumentStart, true));
  if (profiling) {
    var profileCode = $.NSString.stringWithContentsOfFileEncodingError($(argv[4]), $.NSUTF8StringEncoding, null);
    config.userContentController.addUserScript($.WKUserScript.alloc.initWithSourceInjectionTimeForMainFrameOnly(profileCode, $.WKUserScriptInjectionTimeAtDocumentStart, false));
  }
  var web = $.WKWebView.alloc.initWithFrameConfiguration(rect, config);
  web.autoresizingMask = 18;
  win.contentView.addSubview(web);
  var gameRatio = 16 / 9, hostBounds = null, lastPlacement = "", previousCodexPID = 0;
  var selfPID = Number($.NSProcessInfo.processInfo.processIdentifier), metadataReaderVerified = false;
  var fixtureHost = argv[1] === "--qa" && argv.indexOf("--host-fixture") >= 0;
  var geometryCosts = [], geometryRequestPID = 0, geometryRequestedAt = 0, geometryObservedAt = 0;
  function cachedGeometry(pid) {
    var now = Date.now();
    if (pid !== geometryRequestPID || now - geometryRequestedAt > 1000) {
      $(JSON.stringify({ pid: pid, updatedAt: now })).writeToFileAtomicallyEncodingError($(statePath + ".geometry-request"), true, $.NSUTF8StringEncoding, null);
      geometryRequestPID = pid; geometryRequestedAt = now;
    }
    try {
      var report = JSON.parse(ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError($(statePath + ".geometry"), $.NSUTF8StringEncoding, null)));
      if (profiling && report.updatedAt !== geometryObservedAt) { geometryCosts.push(report.queryMs); if (geometryCosts.length > 500) geometryCosts.shift(); }
      geometryObservedAt = report.updatedAt;
      return observedWindowBounds(report, pid, now);
    } catch (_) { return null; }
  }
  function observeHost() {
    if (fixtureHost) {
      if (argv.indexOf("--poll-geometry") >= 0) cachedGeometry(selfPID);
      var fixture = JSON.parse(ObjC.unwrap($.NSString.stringWithContentsOfFileEncodingError($(statePath + ".host.json"), $.NSUTF8StringEncoding, null)));
      return findCodexWindow(fixture.front, fixture.windows || []);
    }
    var running = $.NSWorkspace.sharedWorkspace.frontmostApplication;
    if (!running) { previousCodexPID = 0; return null; }
    var front = { bundleId: ObjC.unwrap(running.bundleIdentifier), pid: Number(running.processIdentifier), hidden: Boolean(running.hidden) };
    if (front.bundleId === "com.openai.codex") previousCodexPID = front.pid;
    else if (front.pid === selfPID && win.keyWindow && previousCodexPID) front = { bundleId: "com.openai.codex", pid: previousCodexPID, hidden: false };
    else { previousCodexPID = 0; return null; }
    return front.hidden ? null : cachedGeometry(front.pid);
  }
  function placement() {
    var screens = [], nativeScreens = $.NSScreen.screens;
    for (var i = 0; i < nativeScreens.count; i++) {
      var f = nativeScreens.objectAtIndex(i).visibleFrame;
      screens.push({ x: f.origin.x, y: f.origin.y, width: f.size.width, height: f.size.height });
    }
    if (!hostBounds || !nativeScreens.count) return null;
    var primary = nativeScreens.objectAtIndex(0).frame;
    return anchorGameWindowFrame(screens, toAppKitWindowBounds(hostBounds, primary.origin.y + primary.size.height), gameRatio);
  }
  function placeWindow(frame) {
    var signature = JSON.stringify(frame);
    if (!frame || signature === lastPlacement) return;
    win.setContentSize($.NSMakeSize(frame.width, frame.height));
    win.setFrameOrigin($.NSMakePoint(frame.x, frame.y));
    lastPlacement = signature;
  }
  app.finishLaunching;
  var loaded = "", dismissed = "", lastEpoch = "", lastStatus = 0, lastMode = "stopped";
  var lastMetadata = 0, metadataPending = false, dismissSerial = 0, gamePaused = null, frameStats = null, lastFrameStats = 0;
  function visibilityScript(visible) {
    return "(()=>{const visible=" + Boolean(visible) + ";if(window.__agentStageHostVisible!==visible){window.__agentStageHostVisible=visible;window.dispatchEvent(new CustomEvent('agent-stage-host-visibility',{detail:{visible}}));}})();";
  }
  function tick() {
    try {
      var raw = $.NSString.stringWithContentsOfFileEncodingError($(statePath), $.NSUTF8StringEncoding, null);
      var state = JSON.parse(ObjC.unwrap(raw));
      var fresh = Date.now() - state.updatedAt < 3500;
      var wanted = fresh && state.active && !state.paused;
      var epoch = state.epoch || "";
      try { hostBounds = wanted ? observeHost() : null; } catch (error) { hostBounds = null; if (fixtureHost) console.log(String(error)); }
      var anchor = placement();
      var mode = gameWindowMode({ fresh: fresh, active: state.active, paused: state.paused, epoch: epoch }, anchor, dismissed);
      if (mode === "visible") {
        if (!/^http:\/\/127\.0\.0\.1:\d+\/codex-stage\?popup=1#/.test(state.url)) throw new Error("Invalid local window URL");
        var targetURL = state.url;
        if (argv[1] === "--qa" && /^[a-z0-9-]+$/.test(argv[2] || "")) targetURL = targetURL.replace("?popup=1#", "?popup=1&game=" + argv[2] + "#");
        if (loaded !== targetURL) {
          web.loadRequest($.NSURLRequest.requestWithURL($.NSURL.URLWithString($(targetURL))));
          loaded = targetURL;
          dismissSerial = 0;
        }
        placeWindow(anchor);
        if (!win.visible || lastEpoch !== epoch) win.orderFrontRegardless;
      } else {
        if (win.visible) win.orderOut(null);
        if (mode === "stopped" && lastMode !== "stopped") web.evaluateJavaScriptCompletionHandler($("window.dispatchEvent(new Event('agent-stage-pause'))"), function () {});
      }
      if (mode !== lastMode && loaded) web.evaluateJavaScriptCompletionHandler($(visibilityScript(mode === "visible")), function () {});
      lastEpoch = wanted ? epoch : "";
      lastMode = mode;
      if (loaded && !metadataPending && Date.now() - lastMetadata > 250) {
        metadataPending = true; lastMetadata = Date.now();
        var observedEpoch = epoch;
        var includeFrameStats = Date.now() - lastFrameStats > 1000;
        if (includeFrameStats) lastFrameStats = Date.now();
        // Read only presentation metadata from our own local WebKit page.
        web.evaluateJavaScriptCompletionHandler($(visibilityScript(mode === "visible") + "JSON.stringify({ratio:Number(document.documentElement.dataset.stageRatio),dismissSerial:Number(document.documentElement.dataset.stageDismissSerial||0),paused:document.documentElement.dataset.stageHostPaused==='true'" + (includeFrameStats ? ",frames:window.__agentStagePerformance?.()" : "") + "})"), function (result) {
          metadataPending = false;
          if (!result) return;
          try {
            var layout = JSON.parse(ObjC.unwrap(result));
            gamePaused = layout.paused;
            if (layout.frames) frameStats = layout.frames;
            if (lastEpoch !== observedEpoch) return;
            if (isFinite(layout.ratio) && layout.ratio >= 0.5 && layout.ratio <= 3 && layout.ratio !== gameRatio) { gameRatio = layout.ratio; }
            if (layout.dismissSerial > dismissSerial) {
              dismissSerial = layout.dismissSerial; dismissed = observedEpoch;
              web.evaluateJavaScriptCompletionHandler($("window.dispatchEvent(new Event('agent-stage-pause'))"), function () {});
              win.orderOut(null);
            }
          } catch (_) {}
        });
      }
      if (Date.now() - lastStatus > 1000) {
        var bounds = win.frame;
        if (fixtureHost && win.visible && !metadataReaderVerified) metadataReaderVerified = readOnscreenWindows(selfPID).some(function (w) { return Math.abs(w.bounds.width - bounds.size.width) < 1; });
        $(JSON.stringify({ visible: Boolean(win.visible), userVisible: isGameWindowVisible(win.visible, win.onActiveSpace, Number(win.occlusionState)), mode: mode, gamePaused: gamePaused, hostAnchored: Boolean(anchor), fixtureHost: fixtureHost, metadataReaderVerified: metadataReaderVerified, onActiveSpace: Boolean(win.onActiveSpace), occlusionState: Number(win.occlusionState), eventLoopRunning: Boolean(app.running), titled: Boolean(Number(win.styleMask) & 1), frame: { x: bounds.origin.x, y: bounds.origin.y, width: bounds.size.width, height: bounds.size.height }, frameStats: frameStats, updatedAt: Date.now() })).writeToFileAtomicallyEncodingError($(statePath + ".status"), true, $.NSUTF8StringEncoding, null);
        if (argv[1] === "--qa" && win.visible) {
          web.evaluateJavaScriptCompletionHandler($("JSON.stringify((()=>{const r=document.querySelector('.playfield')?.getBoundingClientRect();return {width:r?.width,height:r?.height,chromeVisible:[...document.querySelectorAll('.masthead,.library-drawer,.game-heading,.game-bar,.level-strip,.bottom-bar')].some(e=>e.getBoundingClientRect().height>0),title:document.querySelector('#game-title')?.textContent,status:document.querySelector('#agent-status')?.textContent,feedback:document.querySelector('#feedback')?.textContent,connection:document.querySelector('#connection')?.textContent}})())"), function (result) {
            if (result) result.writeToFileAtomicallyEncodingError($(statePath + ".canvas"), true, $.NSUTF8StringEncoding, null);
          });
          if (profiling) web.evaluateJavaScriptCompletionHandler($("JSON.stringify((()=>{const reports=[];function visit(w){if(w.__agentStageProfile)reports.push({...w.__agentStageProfile(),geometryCosts:" + JSON.stringify(geometryCosts) + "});for(const f of w.document.querySelectorAll('iframe'))visit(f.contentWindow);}visit(window);return reports;})())"), function (result) {
            if (result) result.writeToFileAtomicallyEncodingError($(statePath + ".profile"), true, $.NSUTF8StringEncoding, null);
          });
          // Snapshots are excluded from timing runs to avoid measurement overhead.
          if (!profiling) web.takeSnapshotWithConfigurationCompletionHandler($.WKSnapshotConfiguration.alloc.init, function (snapshot) {
            if (!snapshot) return;
            try {
              var bitmap = $.NSBitmapImageRep.alloc.initWithData(snapshot.TIFFRepresentation), colors = {};
              var w = Number(bitmap.pixelsWide), h = Number(bitmap.pixelsHigh);
              for (var y = 0; y < h; y += Math.max(1, Math.floor(h / 24))) for (var x = 0; x < w; x += Math.max(1, Math.floor(w / 24))) {
                var color = bitmap.colorAtXY(x, y).colorUsingColorSpace($.NSColorSpace.deviceRGBColorSpace);
                colors[[Math.round(color.redComponent * 255), Math.round(color.greenComponent * 255), Math.round(color.blueComponent * 255)].join(",")] = true;
              }
              bitmap.representationUsingTypeProperties($.NSBitmapImageFileTypePNG, $.NSDictionary.dictionary).writeToFileAtomically($(statePath + ".png"), true);
              $(JSON.stringify({ colors: Object.keys(colors).length, width: w, height: h })).writeToFileAtomicallyEncodingError($(statePath + ".pixels"), true, $.NSUTF8StringEncoding, null);
            } catch (_) {}
          });
        }
        lastStatus = Date.now();
      }
    } catch (error) { if (win.visible) win.orderOut(null); if (argv[1] === "--qa") console.log(String(error)); }
  }
  // NSRunLoop alone paints WebKit but does not dispatch native mouse/key events.
  ObjC.registerSubclass({ name: "AgentStageWindowTicker", superclass: "NSObject", methods: { "tick:": { types: ["void", ["id"]], implementation: tick } } });
  var ticker = $.AgentStageWindowTicker.alloc.init;
  var notifications = $.NSWorkspace.sharedWorkspace.notificationCenter;
  notifications.addObserverSelectorNameObject(ticker, "tick:", $.NSWorkspaceDidActivateApplicationNotification, null);
  notifications.addObserverSelectorNameObject(ticker, "tick:", $.NSWorkspaceActiveSpaceDidChangeNotification, null);
  var timer = $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(0.15, ticker, "tick:", $(), true);
  $.NSRunLoop.mainRunLoop.addTimerForMode(timer, $.NSRunLoopCommonModes);
  if (nativeInputQA) {
    var inputStart = 0, inputDown = false, inputDone = false, nativeEventNumber = 0;
    function mouse(type, x, y) {
      var size = win.contentView.frame.size;
      var event = $.NSEvent.mouseEventWithTypeLocationModifierFlagsTimestampWindowNumberContextEventNumberClickCountPressure(type, $.NSMakePoint(x / 960 * size.width, size.height - y / 640 * size.height), 0, $.NSProcessInfo.processInfo.systemUptime, win.windowNumber, null, ++nativeEventNumber, 1, type === $.NSEventTypeLeftMouseUp ? 0 : 1);
      if (type === $.NSEventTypeLeftMouseDown) web.mouseDown(event);
      else if (type === $.NSEventTypeLeftMouseUp) web.mouseUp(event);
      else web.mouseDragged(event);
    }
    ObjC.registerSubclass({ name: "AgentStageInputProbe", superclass: "NSObject", methods: { "tick:": { types: ["void", ["id"]], implementation: function () {
      if (!win.visible || !loaded || inputDone) return;
      if (!inputStart) inputStart = Date.now();
      var elapsed = Date.now() - inputStart;
      if (elapsed < 3000) return;
      if (!inputDown) { mouse($.NSEventTypeLeftMouseDown, 480 + Math.sin(.026) * 115, 120); inputDown = true; }
      var y = 120 + Math.min(390, (elapsed - 3000) * .018), x = 480 + Math.sin((y - 118) * .013) * 115;
      mouse($.NSEventTypeLeftMouseDragged, x, y);
      if (elapsed > 25000) { mouse($.NSEventTypeLeftMouseUp, x, y); inputDone = true; }
    } } } });
    var inputProbe = $.AgentStageInputProbe.alloc.init;
    var inputTimer = $.NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(1 / 60, inputProbe, "tick:", $(), true);
    $.NSRunLoop.mainRunLoop.addTimerForMode(inputTimer, $.NSRunLoopCommonModes);
  }
  app.run;
}
