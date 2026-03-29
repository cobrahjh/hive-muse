

# HivePainter Redesign — Modern Dark UI

Redesign the HivePainter AI art generator interface with a sleek, modern aesthetic inspired by the Hive Music Player's dark theme and design language.

## Design System
- **Dark theme**: Deep dark background (#0a0a0a), with subtle dark card surfaces
- **Accent color**: Cyan/teal for the "HIVE" brand and interactive elements (matching the original HivePainter branding)
- **Typography**: Clean monospace/sans-serif mix, uppercase headers with letter-spacing
- **Cards**: Subtle borders, rounded corners, dark elevated surfaces
- **Status indicators**: Green dot for "Ready" status

## Layout & Components

### Header
- "HIVEPAINTER" logo with cyan "HIVE" + white "PAINTER" styling
- Subtitle: "AI ART GENERATOR" in muted text with letter-spacing
- Settings gear icon (top right, like the music player)

### Request Section (Card)
- Dark elevated card with subtle border
- "REQUEST A DRAWING" header in cyan
- Text input with placeholder "describe what you want drawn..."
- "DRAW" button with cyan accent border/fill
- Status indicator (green dot + "Ready" text)

### Gallery Section
- "GALLERY" header with item count badge
- Responsive grid of generated images (3 columns on desktop, 2 on tablet, 1 on mobile)
- Each image card has: rounded image, "copy link" action below
- Hover effects with subtle glow/scale

### Overall Polish
- Smooth transitions and hover states
- Orange accent option for secondary actions (inspired by music player)
- Volume-slider-style progress indicators where applicable
- Consistent spacing and alignment matching the music player's clean layout

## Pages
- Single page app: Index page with the full HivePainter UI
- Gallery uses mock/placeholder images to demonstrate the layout

