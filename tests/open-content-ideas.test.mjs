import test from "node:test";
import assert from "node:assert/strict";
import * as jsxRuntime from "react/jsx-runtime";
import { actionLoader } from "../lib/api/action-test-utils.mjs";

const names = s => Object.fromEntries(s.split(" ").map(n => [n, n]));
const nodes = (tree, type) =>
  Array.isArray(tree)
    ? tree.flatMap(x => nodes(x, type))
    : !tree || typeof tree !== "object"
      ? []
      : [...(tree.type === type ? [tree] : []), ...nodes(tree.props?.children, type)];
const text = tree =>
  Array.isArray(tree)
    ? tree.map(text).join("")
    : typeof tree === "string" || typeof tree === "number"
      ? String(tree)
      : tree && typeof tree === "object"
        ? typeof tree.type === "function" && /^OpenIdea/.test(tree.type.name)
          ? text(tree.type(tree.props))
          : text(tree.props?.children)
        : "";

function makeHooks() {
  const slots = [];
  let cursor = 0;
  return {
    reset() {
      cursor = 0;
    },
    react: {
      useState(initial) {
        const i = cursor++;
        if (!(i in slots)) slots[i] = typeof initial === "function" ? initial() : initial;
        return [
          slots[i],
          value => {
            slots[i] = typeof value === "function" ? value(slots[i]) : value;
          },
        ];
      },
      useEffect() {},
    },
  };
}

function commonUiMocks() {
  return {
    "react/jsx-runtime": jsxRuntime,
    "lucide-react": new Proxy({}, { get: (_, key) => String(key) }),
    "next/link": ({ children, ...props }) => jsxRuntime.jsx("a", { ...props, children }),
    sonner: { toast: { success() {}, error() {} } },
    "@/components/stats-card": names("StatsCard"),
    "@/components/ui/badge": names("Badge"),
    "@/components/ui/button": names("Button"),
    "@/components/ui/card": names("Card CardContent CardDescription CardHeader CardTitle"),
    "@/components/ui/dialog": names("Dialog DialogContent DialogDescription DialogFooter DialogHeader DialogTitle"),
    "@/components/ui/dropdown-menu": names("DropdownMenu DropdownMenuContent DropdownMenuItem DropdownMenuTrigger"),
    "@/components/ui/input": names("Input"),
    "@/components/ui/label": names("Label"),
    "@/components/ui/select": names("Select SelectContent SelectItem SelectTrigger SelectValue"),
    "@/components/ui/table": names("Table TableBody TableCell TableHead TableHeader TableRow"),
    "@/components/ui/tabs": names("Tabs TabsContent TabsList TabsTrigger"),
    "@/components/ui/textarea": names("Textarea"),
  };
}

const sampleIdeas = [
  {
    id: "idea-1",
    user_id: "user-1",
    title: "UK Student Visa Checklist",
    category: "Visa",
    format: "Carousel",
    description: "5 documents students often forget before visa submission.",
    reference_url: "https://example.com/visa-reel",
    user: { id: "user-1", name: "Ada Obi", department: "Visa" },
  },
  {
    id: "idea-2",
    user_id: "user-2",
    title: "=SUM(A1:A2) Flight Booking Hack",
    category: "Flights",
    format: null,
    description: "Line one\twith tab\nLine two",
    reference_url: null,
    user: { id: "user-2", name: "Bola Ade", department: "Ticketing" },
  },
];

test("open content idea actions hit expected endpoints and payloads", async () => {
  const calls = [];
  const actions = actionLoader(async (method, endpoint, body) => {
    calls.push([method, endpoint, body]);
    if (method === "delete") return { success: true, data: null };
    if (method === "get") return { success: true, data: { data: sampleIdeas } };
    return { success: true, data: { data: sampleIdeas[0] } };
  }).load("lib/api/content-collections.ts");

  const mine = await actions.getMyOpenContentIdeas();
  assert.equal(mine.length, 2);
  assert.deepEqual(calls[0], ["get", "/api/my/content-ideas/open", undefined]);

  const payload = {
    title: "New Visa Myth",
    category: "Visa",
    description: "Explain common visa myths clearly.",
    format: "Reel / TikTok",
    reference_url: "https://example.com/ref",
  };
  await actions.saveMyOpenContentIdea(payload);
  assert.deepEqual(calls[1], ["post", "/api/my/content-ideas/open", payload]);

  await actions.saveMyOpenContentIdea(payload, "idea-1");
  assert.deepEqual(calls[2], ["patch", "/api/my/content-ideas/open/idea-1", payload]);

  const deleted = await actions.deleteMyOpenContentIdea("idea-1");
  assert.deepEqual(deleted, { deleted: true });
  assert.deepEqual(calls[3], ["delete", "/api/my/content-ideas/open/idea-1", undefined]);

  const all = await actions.getOpenContentIdeas();
  assert.equal(all.length, 2);
  assert.deepEqual(calls[4], ["get", "/api/social-media/content-ideas", undefined]);
});

test("openIdeasSpreadsheetCells formats header/rows and escapes formula cells", () => {
  const { openIdeasSpreadsheetCells, spreadsheetClipboard } = actionLoader().load(
    "components/social-media/content-copy.ts",
  );
  const rows = openIdeasSpreadsheetCells(sampleIdeas);
  assert.deepEqual(rows[0], [
    "Staff member",
    "Category",
    "Format",
    "Idea title",
    "Description",
    "Reference link",
  ]);
  assert.deepEqual(rows[1], [
    "Ada Obi",
    "Visa",
    "Carousel",
    "UK Student Visa Checklist",
    "5 documents students often forget before visa submission.",
    "https://example.com/visa-reel",
  ]);
  assert.deepEqual(rows[2], [
    "Bola Ade",
    "Flights",
    "",
    "=SUM(A1:A2) Flight Booking Hack",
    "Line one\twith tab\nLine two",
    "",
  ]);

  const tsv = spreadsheetClipboard(rows);
  const lines = tsv.split("\n");
  assert.equal(lines.length, 3);
  assert.ok(lines[2].includes("'=SUM(A1:A2) Flight Booking Hack"));
  assert.ok(lines[2].includes("Line one with tab Line two"));
});

test("MyOpenIdeasBank filters, deletes, and submits via OpenIdeaDialog", async () => {
  const hooks = makeHooks();
  const savedCalls = [];
  const deletedCalls = [];
  const invalidations = [];
  const toasts = [];
  const openMod = actionLoader(undefined, {
    ...commonUiMocks(),
    react: hooks.react,
    sonner: { toast: { success: m => toasts.push(["ok", m]), error: m => toasts.push(["err", m]) } },
    "@tanstack/react-query": {
      useQuery: ({ queryKey }) => ({
        data: queryKey[0] === "my-open-content-ideas" ? sampleIdeas : [],
        isPending: false,
        isError: false,
        isFetching: false,
        refetch() {},
      }),
      useQueryClient: () => ({
        invalidateQueries: q => invalidations.push(q.queryKey),
      }),
    },
    "@/lib/api/content-collections": {
      getMyOpenContentIdeas: async () => sampleIdeas,
      getOpenContentIdeas: async () => sampleIdeas,
      saveMyOpenContentIdea: async (...args) => {
        savedCalls.push(args);
        return sampleIdeas[0];
      },
      deleteMyOpenContentIdea: async id => {
        deletedCalls.push(id);
        return { deleted: true };
      },
    },
    "./content-copy-button": names("ContentCopyButton"),
  }).load("components/social-media/open-content-ideas.tsx");

  const renderBank = () => {
    hooks.reset();
    return openMod.MyOpenIdeasBank({});
  };

  let tree = renderBank();
  assert.equal(nodes(tree, "TableRow").length, 3); // header + 2 ideas

  // Delete first idea
  const deleteBtn = nodes(tree, "Button").find(
    n => n.props["aria-label"] === "Delete UK Student Visa Checklist",
  );
  await deleteBtn.props.onClick();
  assert.deepEqual(deletedCalls, ["idea-1"]);

  // Filter by category
  const categorySelect = nodes(tree, "Select").find(n =>
    nodes(n, "SelectTrigger")[0]?.props["aria-label"] === "Filter my ideas by category",
  );
  categorySelect.props.onValueChange("Visa");
  tree = renderBank();
  assert.equal(nodes(tree, "TableRow").length, 2); // header + 1 idea
  assert.match(text(tree), /UK Student Visa Checklist/);

  // Filter by search
  const searchInput = nodes(tree, "Input").find(n => n.props["aria-label"] === "Search my open ideas");
  searchInput.props.onChange({ target: { value: "nonexistent" } });
  tree = renderBank();
  assert.match(text(tree), /No matching ideas/);

  // Submit OpenIdeaDialog
  const dialogHooks = makeHooks();
  const dialogMod = actionLoader(undefined, {
    ...commonUiMocks(),
    react: dialogHooks.react,
    sonner: { toast: { success: m => toasts.push(["ok", m]), error: m => toasts.push(["err", m]) } },
    "@tanstack/react-query": {
      useQuery: () => ({ data: [], isPending: false, isError: false }),
      useQueryClient: () => ({
        invalidateQueries: q => invalidations.push(q.queryKey),
      }),
    },
    "@/lib/api/content-collections": {
      getMyOpenContentIdeas: async () => [],
      getOpenContentIdeas: async () => [],
      saveMyOpenContentIdea: async (...args) => {
        savedCalls.push(args);
        return sampleIdeas[0];
      },
      deleteMyOpenContentIdea: async () => ({ deleted: true }),
    },
    "./content-copy-button": names("ContentCopyButton"),
  }).load("components/social-media/open-content-ideas.tsx");

  const renderForm = () => {
    dialogHooks.reset();
    const dialog = dialogMod.OpenIdeaDialog({ open: true, onOpenChange() {}, idea: null });
    const formEl = dialog.props.children.props.children[1];
    return formEl.type(formEl.props);
  };

  let fTree = renderForm();
  nodes(fTree, "Input").find(n => n.props.id === "open-idea-title").props.onChange({
    target: { value: "Birth Services Packing List" },
  });
  nodes(fTree, "Select")[0].props.onValueChange("Birth Services");
  nodes(fTree, "Select")[1].props.onValueChange("Reel / TikTok");
  nodes(fTree, "Textarea")[0].props.onChange({
    target: { value: "Hospital bag essentials for travelling moms." },
  });
  nodes(fTree, "Input").find(n => n.props.id === "open-idea-reference").props.onChange({
    target: { value: "https://example.com/packing" },
  });
  fTree = renderForm();
  await fTree.props.onSubmit({ preventDefault() {} });

  assert.equal(savedCalls.length, 1);
  assert.deepEqual(savedCalls[0], [
    {
      title: "Birth Services Packing List",
      category: "Birth Services",
      description: "Hospital bag essentials for travelling moms.",
      format: "Reel / TikTok",
      reference_url: "https://example.com/packing",
    },
    undefined,
  ]);
  assert.ok(invalidations.some(k => k[0] === "my-open-content-ideas"));
  assert.ok(invalidations.some(k => k[0] === "open-content-ideas"));
  assert.ok(toasts.some(([kind, msg]) => kind === "ok" && /Idea Bank/.test(msg)));
});

test("MyContentIdeas renders Assigned Themes and Idea Bank tabs", () => {
  const hooks = makeHooks();
  const mod = actionLoader(undefined, {
    ...commonUiMocks(),
    react: hooks.react,
    "@tanstack/react-query": {
      useQuery: ({ queryKey }) => ({
        data: queryKey[0] === "my-open-content-ideas" ? sampleIdeas : [],
        isPending: false,
        isError: false,
        refetch() {},
      }),
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
    },
    "@/lib/api/content-collections": {
      getMyContentAssignments: async () => [],
      getMyOpenContentIdeas: async () => sampleIdeas,
      saveContentIdea: async () => ({}),
    },
    "./content-helpers": names("AssignmentProgress deadlineLabel"),
    "./content-ideas-table": names("ContentIdeasTable"),
    "./open-content-ideas": names("MyOpenIdeasBank OpenIdeaDialog"),
    "@/lib/api/hooks/use-notifications": {
      useRoleNotifications: () => ({ data: { contentIdeas: 2 } }),
    },
  }).load("components/social-media/my-content-ideas.tsx");

  hooks.reset();
  const tree = mod.MyContentIdeas();
  const triggers = nodes(tree, "TabsTrigger");
  assert.deepEqual(
    triggers.map(t => t.props.value),
    ["assigned", "idea-bank"],
  );
  assert.match(text(triggers[0]), /Assigned Themes/);
  assert.match(text(triggers[0]), /2/);
  assert.match(text(triggers[1]), /Idea Bank \(2\)/);
  assert.equal(nodes(tree, "MyOpenIdeasBank").length, 1);
  assert.equal(nodes(tree, "OpenIdeaDialog").length, 1);
});

test("ContentCollections and SocialMediaIdeaBank render tabs, badge, and filter by category/staff", () => {
  const navMod = actionLoader(undefined, {
    "lucide-react": new Proxy({}, { get: (_, key) => String(key) }),
  }).load("lib/navigation.ts");
  const collectionsNav = navMod.departmentNav.find(n => n.url === "/social-media/content-collections");
  assert.equal(collectionsNav?.badgeKey, "openContentIdeas");

  const hooks = makeHooks();
  const collectionsMod = actionLoader(undefined, {
    ...commonUiMocks(),
    react: hooks.react,
    "@tanstack/react-query": {
      useQuery: () => ({ data: [], isPending: false, isError: false, refetch() {} }),
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
    },
    "@/lib/api/content-collections": {
      getContentCollections: async () => [],
      getContentStaff: async () => [],
      saveContentCollection: async () => ({}),
      publishContentCollection: async () => ({}),
      changeContentDeadline: async () => ({}),
    },
    "@/lib/api/hooks/use-notifications": {
      useRoleNotifications: () => ({ data: { openContentIdeas: 3 } }),
    },
    "./content-helpers": {
      deadlineInput: () => "2026-11-16T12:00",
      deadlineISO: v => v,
      deadlineLabel: v => v,
    },
    "./open-content-ideas": names("SocialMediaIdeaBank"),
  }).load("components/social-media/content-collections.tsx");

  hooks.reset();
  const cTree = collectionsMod.ContentCollections();
  const triggers = nodes(cTree, "TabsTrigger");
  assert.deepEqual(
    triggers.map(t => t.props.value),
    ["collections", "idea-bank"],
  );
  assert.match(text(triggers[0]), /Monthly Collections/);
  assert.match(text(triggers[1]), /Idea Bank3/);
  assert.equal(nodes(cTree, "SocialMediaIdeaBank").length, 1);

  // Test SocialMediaIdeaBank category and staff filtering
  const bankHooks = makeHooks();
  const bankMod = actionLoader(undefined, {
    ...commonUiMocks(),
    react: bankHooks.react,
    "@tanstack/react-query": {
      useQuery: () => ({ data: sampleIdeas, isPending: false, isError: false, isFetching: false, refetch() {} }),
      useQueryClient: () => ({ invalidateQueries: async () => {} }),
    },
    "@/lib/api/content-collections": {
      getMyOpenContentIdeas: async () => [],
      getOpenContentIdeas: async () => sampleIdeas,
      saveMyOpenContentIdea: async () => sampleIdeas[0],
      deleteMyOpenContentIdea: async () => ({ deleted: true }),
    },
    "./content-copy-button": names("ContentCopyButton"),
  }).load("components/social-media/open-content-ideas.tsx");

  const renderSocialBank = () => {
    bankHooks.reset();
    return bankMod.SocialMediaIdeaBank();
  };

  let sTree = renderSocialBank();
  assert.equal(nodes(sTree, "TableRow").length, 3); // header + 2 ideas

  // Filter by staff
  const staffSelect = nodes(sTree, "Select").find(
    n => nodes(n, "SelectTrigger")[0]?.props["aria-label"] === "Filter by staff",
  );
  staffSelect.props.onValueChange("user-2");
  sTree = renderSocialBank();
  assert.equal(nodes(sTree, "TableRow").length, 2);
  assert.match(text(sTree), /Bola Ade/);

  // Filter by category (Flights matches user-2, Visa does not)
  const catSelect = nodes(sTree, "Select").find(
    n => nodes(n, "SelectTrigger")[0]?.props["aria-label"] === "Filter by category",
  );
  catSelect.props.onValueChange("Visa");
  sTree = renderSocialBank();
  assert.match(text(sTree), /No matching ideas/);
});
