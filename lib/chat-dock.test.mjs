import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "./api/action-test-utils.mjs";

const { parseChatDock, snapChatDock, clampChatPoint } = actionLoader(() => {}).load("lib/chat-dock.ts");

test("chat snaps to six edge positions and clamps movement inside the usable screen", () => {
  for (const [y, level] of [[0, "top"], [272, "middle"], [544, "bottom"]]) {
    assert.deepEqual(snapChatDock(0, y, 1000, 600), { edge: "left", level });
    assert.deepEqual(snapChatDock(944, y, 1000, 600), { edge: "right", level });
  }
  assert.deepEqual(clampChatPoint(-50, 900, 1000, 600), { x: 0, y: 544 });
  assert.deepEqual(clampChatPoint(900, -50, 320, 500), { x: 264, y: 0 });
  assert.deepEqual(clampChatPoint(30, 30, 40, 40), { x: 0, y: 0 });
});

test("stored chat preferences are validated and malformed values recover to bottom right", () => {
  assert.deepEqual(parseChatDock('{"edge":"left","level":"middle"}'), { edge: "left", level: "middle" });
  for (const value of [null, "broken", "{}", '{"edge":"offscreen","level":"top"}']) {
    assert.deepEqual(parseChatDock(value), { edge: "right", level: "bottom" });
  }
});

function harness(pathname = "/dashboard", savedDock = null) {
  const hooks = [], saved = [];
  let cursor = 0;
  const storage = { setItem: (...args) => saved.push(args) };
  const { load } = actionLoader(() => {}, {
    react: {
      useEffect() {},
      useSyncExternalStore() { return savedDock; },
      useState(initial) {
        const index = cursor++;
        if (!(index in hooks)) hooks[index] = initial;
        return [hooks[index], value => { hooks[index] = typeof value === "function" ? value(hooks[index]) : value; }];
      },
      useRef(initial) {
        const index = cursor++;
        if (!(index in hooks)) hooks[index] = { current: initial };
        return hooks[index];
      },
    },
    "react/jsx-runtime": jsxRuntime,
    "next/link": { default: "Link" },
    "next/navigation": { usePathname: () => pathname },
    "lucide-react": { MessageCircle: "MessageCircle" },
    "@/lib/api/hooks/use-notifications": { useRoleNotifications: () => ({ data: { chatMessages: { items: [{ count: 3 }] } } }) },
    "@tanstack/react-query": { useQueryClient: () => ({ invalidateQueries() {} }) },
    "@/lib/echo": { getEchoInstance: () => null },
    "@/providers/user-provider": { useUser: () => ({ user: { id: "staff" } }) },
  });
  const Component = load("components/chat/floating-chat-button.tsx").FloatingChatButton;
  const captures = new Set();
  const element = {
    getBoundingClientRect: () => ({ left: 964, top: 640, width: 56, height: 56 }),
    setPointerCapture: id => captures.add(id),
    hasPointerCapture: id => captures.has(id),
    releasePointerCapture: id => captures.delete(id),
  };
  return {
    saved, storage,
    render() {
      cursor = 0;
      const tree = Component();
      if (!tree) return null;
      tree.props.ref.current = { getBoundingClientRect: () => ({ left: 20, top: 96, width: 1000, height: 600 }) };
      return tree.props.children[0];
    },
    event(x = 992, y = 668) {
      return { pointerId: 1, isPrimary: true, button: 0, clientX: x, clientY: y, currentTarget: element, preventDefault() {} };
    },
  };
}

test("dragging snaps and remembers the location without navigating to chat", () => {
  const control = harness();
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: control.storage };
  try {
    const button = control.render();
    button.props.onPointerDown(control.event());
    button.props.onPointerMove(control.event(48, 124));
    assert.equal(control.render().props.style.left, 0);
    button.props.onPointerUp(control.event(48, 124));
    assert.equal(control.render().props.style.top, 0);
    assert.deepEqual(JSON.parse(control.saved[0][1]), { edge: "left", level: "top" });
    let prevented = false;
    button.props.onClick({ detail: 1, preventDefault() { prevented = true; }, stopPropagation() {} });
    assert.equal(prevented, true);
  } finally { globalThis.window = previousWindow; }
});

test("small pointer movement remains a click and cancellation restores the dock", () => {
  const control = harness();
  const button = control.render();
  button.props.onPointerDown(control.event());
  button.props.onPointerMove(control.event(994, 670));
  button.props.onPointerUp(control.event(994, 670));
  button.props.onClick({ detail: 1, preventDefault() { assert.fail("Normal click was blocked"); } });
  assert.equal(control.saved.length, 0);
  button.props.onPointerDown(control.event());
  button.props.onPointerMove(control.event(48, 124));
  button.props.onPointerCancel(control.event(48, 124));
  assert.equal(typeof control.render().props.style.left, "string");
  assert.equal(control.saved.length, 0);
  assert.equal(control.render().props.href, "/chat");
  assert.match(control.render().props["aria-label"], /1 unread chats/);
});

test("chat stays hidden on chat and attendance scanning pages", () => {
  assert.equal(harness("/chat").render(), null);
  assert.equal(harness("/attendance/scan").render(), null);
});

test("saved position restores on mount and keyboard movement remembers a new dock", () => {
  const control = harness("/dashboard", '{"edge":"right","level":"middle"}');
  const previousWindow = globalThis.window;
  globalThis.window = { localStorage: control.storage };
  try {
    assert.match(control.render().props.style.top, /50%/);
    let prevented = false;
    control.render().props.onKeyDown({ altKey: true, key: "ArrowLeft", preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    assert.equal(control.render().props.style.left, 0);
    assert.deepEqual(JSON.parse(control.saved[0][1]), { edge: "left", level: "middle" });
    control.render().props.onKeyDown({ altKey: true, key: "ArrowUp", preventDefault() {} });
    assert.equal(control.render().props.style.top, 0);
  } finally { globalThis.window = previousWindow; }
});
