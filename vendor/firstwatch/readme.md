# FirstWatch Design System

Token-driven React + CSS design system for **FirstWatch** — real-time situational awareness for public safety (EMS, fire, dispatch). "Genuine · Caring · Can-Do — since 1998." The component set mirrors the attached Figma kit, which is a shadcn/ui-pattern library re-themed to FirstWatch: Lato type, FirstWatch blue, Lucide icons.

## Sources
- **Figma**: "FirstWatch Design System.fig" (attached/mounted) — 85 component families, ~886-glyph Lucide icon set, 4 variable collections (444 variables), Colors + Typography reference pages.
- **Codebase**: attached `components/` folder — 19 pre-built FirstWatch component directories (fw-\* class conventions), imported and extended here.
- **Uploads**: `uploads/` — full Lato TTF family (18 files), FirstWatch seal + wordmark lockup PNGs.

## Content fundamentals
- **Voice**: warm, direct, no fuss. Short declarative sentences. Explain the benefit, skip the jargon: "Every metric updates as calls close. No refresh, no fuss."
- **Casing**: sentence case everywhere — headings, buttons ("New order", "Save page as…"), menu items, labels. Never title case, never all-caps except tiny overline labels.
- **Person**: address the user as "you"; FirstWatch is "we". Active voice.
- **Emoji**: never. Keyboard shortcut glyphs (⌘P) are fine in menus.
- **Microcopy**: confirmations state consequences plainly ("This cannot be undone."); empty states are helpful, not cute ("No results found.").

## Visual foundations
- **Color**: white/near-white surfaces, neutral-900 `rgb(23,23,23)` text. One accent: FirstWatch blue (`--firstwatch-600` `rgb(2,132,199)`, hover 700). Full Tailwind ramps available as tokens, but UI stays blue + neutrals; red-600 strictly for destructive, green-600/amber-600 for status. Brand seal navy `--fw-navy #0B2A4A` + gold `--fw-gold` reserved for brand moments (headers, covers, avatars).
- **Dark mode**: first-class — `[data-theme="dark"]` or `.dark` flips the semantic tokens (neutral-900 surfaces, firstwatch-500 primary).
- **Type**: Lato for everything (`--font-sans`/`--font-ui`), Menlo mono, Georgia serif (rare). Headings 600 SemiBold with -0.01em tracking; body 14px/1.5; labels Medium 500; scale from the `font/size` tokens (xs 12 → 4xl 36+).
- **Shape**: radius sm 2 / default 4 / md 6 / lg 8 / xl 12; pills 9999. Controls sit at md (6px); cards/dialogs md–lg. 1px `--border` (neutral-300) hairlines everywhere.
- **Elevation**: soft, low-alpha shadows (rgba(0,0,0,.05–.09)); menus/dialogs use `--shadow-xl`; cards `--shadow-md` or flat.
- **Backgrounds**: flat color only — no gradients, no textures, no illustration. Imagery is functional (avatars, maps).
- **Motion**: 120–240ms, `cubic-bezier(.16,1,.3,1)`. Overlays fade, panels pop 6px, sheets/drawers slide, skeletons shimmer. `prefers-reduced-motion` drops all of it.
- **States**: hovers tint with `--surface-hover` (neutral-100) or darken the fill one step (600→700); focus is a 2px `--ring` outline (blue-600) offset 2px, or 3px 18% glow on inputs; disabled = 50% opacity; press states rely on color, no shrink.
- **Layout**: generous 16–24px padding in panels; flex/grid with gap; density is comfortable, data tables tighter (14px cells).

## Iconography
- **Lucide only** (brand rule). The kit embeds the Lucide set (~886 glyphs, 24×24, 2px stroke, round caps) and all 884 resolvable glyphs are materialized locally in `assets/icons/icon-data.js` with an `<Icon name="…" size={…}/>` React wrapper (`assets/icons/Icon.jsx`; names indexed in `Icon.d.ts`).
- Component internals render icons as `<i data-lucide="name">` and the demo cards hydrate them from the Lucide CDN (`unpkg.com/lucide`) via `window.__fwRefreshIcons()` (in `components/_card.js`). Either path is on-brand; prefer `<Icon>` for offline/self-contained work.
- Icons inherit `currentColor`. UI icons are 16px inside controls, 20px standalone. No emoji, no unicode-as-icon.
- One custom glyph ships with the kit: `shadcn-logo` (kit provenance).

## Tokens
`styles.css` (root) imports everything:
- `tokens/fonts.css` — @font-face for the 18 Lato TTFs in `assets/fonts/`.
- `tokens/fig-tokens.css` — all 4 Figma variable collections (444 variables; light `:root` + dark scope): `_Colour Theming` ramps incl. `--firstwatch-*`, `Colour Semantics` (`--background --foreground --primary --ring …`), `Tailwind CSS Classes` (font sizes/weights/leading, radii, blur, min-width — unitless floats, multiply by 1px), Ungrouped.
- `tokens/fig-typography.css` — generated; the kit defines no named text styles (0 entries, kept for fidelity).
- `tokens/semantic.css` — bridge aliases the component CSS consumes (`--surface --fg --radius-md --dur-fast --shadow-* --semantic-* --fw-navy/gold`).
- `components/firstwatch-ui.css` + `components/firstwatch-ui-ext.css` — the fw-\* component classes.

## Components (window.FirstWatchDesignSystem_05fdf3)
Accordion, AccordionItem, Alert, AlertDialog, Avatar, AvatarGroup, Badge, Breadcrumb, BreadcrumbItem, Button, Calendar, CalendarDay, CalendarHead, CalendarWeek, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Carousel, Checkbox, CheckboxPrimitive, Collapsible, Combobox, Command, CommandHeader, CommandInput, CommandItem, ContextMenu, DatePicker, Dialog, DialogContent, Drawer, DrawerContent, DropdownMenu, HoverCard, HoverCardContent, Icon, Input, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, Label, MenuItem, MenuLabel, Menubar, MenubarItem, NavigationMenu, NavigationMenuContent, NavigationMenuContentItem, NavigationMenuItem, NavigationMenuViewport, Pagination, PaginationItem, PaginationLink, PasswordInput, Popover, PopoverContent, Progress, Radio, RadioButton, RadioGroup, RadioGroupItem, ScrollArea, ScrollBar, ScrollListItem, Select, SelectGroup, SelectItem, SelectTrigger, Separator, Sheet, SheetContent, Skeleton, Slider, Switch, SwitchPrimitive, TabTrigger, Table, TableBody, TableCaption, TableCell, TableColumn, TableHead, TableHeader, TableRow, Tabs, Textarea, Toast, Toaster, Toggle, ToggleGroup, Tooltip.

Every Figma family maps to one of these; sub-part families (Calendar Day, Command Input, sheet content, …) are named part exports of their parent's directory.

### Intentional additions
- `Icon` — React wrapper over the materialized Lucide data (the kit ships glyphs as components; a name-indexed wrapper is the usable form).
- `Toaster` — stack manager for `Toast` (the kit shows toasts only as static cards).
- `PasswordInput`, `AvatarGroup`, `DatePicker` — came with the attached FirstWatch codebase.

## Index
- `styles.css` — global CSS entry (link this one file).
- `tokens/` — fonts, Figma variables, semantic bridge.
- `components/<Name>/` — <Name>.jsx + .d.ts + demo card (.html/.card.html) per family group.
- `assets/` — `firstwatch-seal.png`, `firstwatch-logo-full.png` (white lockup — dark grounds only), `fonts/` (Lato TTFs), `icons/` (icon-data.js, Icon.jsx).
- `guidelines/` — foundation specimen cards (Colors / Type / Spacing / Brand).
- `SKILL.md` — agent-skill entry point.

## Caveats
- Kit families `_Component Header` and `_Palette` are the Figma file's own documentation chrome (page headers, palette swatch cells), not product UI - intentionally not built.
- The kit's Figma text layers were largely set in **Inter**, but the kit's own font token says `font/family/sans: "Lato"` and the brand font is Lato — Lato is canonical here; no Inter files ship.
- No SVG logo exists in the sources — only the seal and the white wordmark lockup PNGs. The wordmark is white: it disappears on light grounds; use `--fw-navy`.
- 884 of ~886 kit glyphs materialized; any stragglers are covered by the Lucide CDN path.
- Two components exist as static panels by design (`PopoverContent`, `ScrollBar` is decorative — native scrollbars are styled instead).
