# 🤖 Complete Build Guide: Ploxel 3D
# Module Prompts + Implementation Steps

**Project:** Ploxel 3D MVP (Ploxel)
**Usage:** Follow this guide step-by-step, copy prompts to AI assistants  
**Timeline:** 3-4 weeks solo dev

---

# 📋 Table of Contents

1. [Project Setup](#1-project-setup)
2. [Week 1: 3D Globe Foundation](#week-1-3d-globe-foundation)
3. [Week 2: Drawing System](#week-2-drawing-system)
4. [Week 3: Real-Time & Backend](#week-3-real-time--backend)
5. [Week 4: Polish & Launch](#week-4-polish--launch)

---

# 1. Project Setup

## Day 1: Initialize Project

### 💻 PROMPT FOR AI - NEXT.JS SETUP:

```
I'm building a 3D Earth drawing platform called Ploxel 3D (Ploxel) using Next.js 14, Three.js, and Supabase.

Please create the initial Next.js project with:

1. PROJECT STRUCTURE:
ploxel/
├── src/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   └── api/
│   │       ├── stamp/route.ts
│   │       ├── enhance/route.ts
│   │       └── activity/route.ts
│   ├── components/
│   │   ├── Globe3D.tsx
│   │   ├── DrawingCanvas.tsx
│   │   ├── DrawingTools.tsx
│   │   ├── ActivityFeed.tsx
│   │   ├── AIEnhanceButton.tsx
│   │   └── StampButton.tsx
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── globe-utils.ts
│   │   └── realtime.ts
│   ├── hooks/
│   │   ├── useDrawing.ts
│   │   ├── useGlobe.ts
│   │   └── useRealtime.ts
│   └── types/
│       ├── drawing.ts
│       └── globe.ts
├── public/
│   └── textures/
│       └── earth-8k.jpg
├── package.json
├── tsconfig.json
└── tailwind.config.ts

2. PACKAGE.JSON dependencies:
{
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "@supabase/supabase-js": "^2.39.0",
    "tailwindcss": "^3.4.0",
    "framer-motion": "^10.16.0",
    "zustand": "^4.4.7",
    "openai": "^4.20.0"
  }
}

3. TAILWIND CONFIG - Dark theme optimized:
- Background: #0a0e1a (deep space blue)
- Accent: #00ffff (neon cyan)
- Secondary: #ff00ff (neon magenta)

4. LAYOUT.TSX:
- Basic HTML structure
- Metadata: "Ploxel 3D - Draw on Earth"
- Dark mode by default
- Global styles

5. PAGE.TSX - Landing page scaffold:
- Title: "Ploxel 3D"
- Tagline: "Draw on Earth, Share with the World"
- Container for Globe component

Please generate all these files with complete, production-ready code.
```

---

### 💻 PROMPT FOR AI - SUPABASE SETUP:

```
Set up Supabase for my Ploxel 3D project.

Create the following:

1. DATABASE SCHEMA (SQL):

```sql
-- Users table (minimal for MVP)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP DEFAULT NOW(),
  guest_id TEXT UNIQUE,
  google_id TEXT UNIQUE,
  discord_id TEXT UNIQUE,
  username TEXT
);

-- Drawings table
CREATE TABLE drawings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  image_url TEXT NOT NULL,
  latitude DECIMAL(9,6) NOT NULL,
  longitude DECIMAL(9,6) NOT NULL,
  bounds JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  enhanced BOOLEAN DEFAULT FALSE,
  original_image_url TEXT
);

-- Activity log
CREATE TABLE activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  drawing_id UUID REFERENCES drawings(id),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_drawings_created_at ON drawings(created_at DESC);
CREATE INDEX idx_drawings_location ON drawings(latitude, longitude);
CREATE INDEX idx_activity_created_at ON activity(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE drawings;
ALTER PUBLICATION supabase_realtime ADD TABLE activity;
```

2. SUPABASE CLIENT SETUP (src/lib/supabase.ts):
- Create Supabase client with environment variables
- Export typed client
- Include helper functions for auth

3. ENVIRONMENT VARIABLES (.env.local):
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_key
```

4. TYPE DEFINITIONS (src/types/drawing.ts):
```typescript
export interface Drawing {
  id: string;
  user_id: string;
  image_url: string;
  latitude: number;
  longitude: number;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  created_at: string;
  enhanced: boolean;
  original_image_url?: string;
}
```

Please generate complete setup code.
```

---

# Week 1: 3D Globe Foundation

## Day 2-3: 3D Globe Component

### 💻 PROMPT FOR AI - GLOBE COMPONENT:

```
Create a Three.js globe component for my Ploxel 3D project.

FILE: src/components/Globe3D.tsx

REQUIREMENTS:

1. Create a React component using @react-three/fiber that displays:
   - A 3D sphere representing Earth
   - Earth texture loaded from /textures/earth-8k.jpg
   - Smooth rotation on mouse drag
   - Zoom controls on scroll
   - Click to select region

2. COMPONENT STRUCTURE:
```typescript
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { useRef, useState } from 'react';
import * as THREE from 'three';

interface Globe3DProps {
  onRegionSelect?: (lat: number, long: number) => void;
  drawingsTexture?: THREE.Texture; // For dynamic updates
}

export default function Globe3D({ onRegionSelect, drawingsTexture }: Globe3DProps) {
  // Implementation
}
```

3. FEATURES TO IMPLEMENT:

a) **Earth Sphere:**
   - Radius: 5 units
   - Segments: 64x64 (smooth)
   - Load texture from public folder
   - Apply to MeshStandardMaterial

b) **Lighting:**
   - AmbientLight (0.5 intensity)
   - DirectionalLight from top-right (0.8 intensity)
   - Simulate day/night if possible

c) **Camera Controls:**
   - OrbitControls from drei
   - Enable rotation and zoom
   - Disable pan (only rotate + zoom)
   - Min distance: 6 units
   - Max distance: 20 units
   - Smooth damping enabled

d) **Raycasting (Click Detection):**
   - Detect click on globe surface
   - Convert click to latitude/longitude
   - Call onRegionSelect callback

e) **Dynamic Texture Updates:**
   - Accept drawingsTexture prop
   - Overlay drawings on Earth texture
   - Update when new drawings added

4. COORDINATE CONVERSION FUNCTIONS:

Include helper functions:
```typescript
function uvToLatLong(u: number, v: number) {
  const long = u * 360 - 180;
  const lat = (1 - v) * 180 - 90;
  return { lat, long };
}

function latLongToUV(lat: number, long: number) {
  const u = (long + 180) / 360;
  const v = 1 - (lat + 90) / 180;
  return { u, v };
}
```

5. PERFORMANCE OPTIMIZATIONS:
   - Use useMemo for geometry
   - Throttle mouse events
   - Request animation frame for smooth rotation

6. RESPONSIVE CANVAS:
```typescript
<Canvas
  camera={{ position: [0, 0, 15], fov: 45 }}
  style={{ width: '100%', height: '100vh' }}
>
  {/* Scene content */}
</Canvas>
```

Please implement with TypeScript, proper error handling, and smooth animations.
```

---

### 💻 PROMPT FOR AI - COORDINATE UTILITIES:

```
Create utility functions for coordinate conversions in Ploxel 3D.

FILE: src/lib/globe-utils.ts

REQUIREMENTS:

1. **Lat/Long to UV Mapping:**
```typescript
export function latLongToUV(lat: number, long: number): { u: number; v: number } {
  // Convert geographic coordinates to texture UV coordinates
  // Latitude: -90 to 90 → V: 1 to 0
  // Longitude: -180 to 180 → U: 0 to 1
}

export function uvToLatLong(u: number, v: number): { lat: number; long: number } {
  // Reverse conversion
}
```

2. **3D Point to Lat/Long:**
```typescript
export function cartesianToLatLong(
  x: number,
  y: number,
  z: number,
  radius: number = 5
): { lat: number; long: number } {
  // Convert 3D sphere coordinates to lat/long
  // Use spherical coordinate math
}
```

3. **Region Bounds Calculator:**
```typescript
export interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
  center: { lat: number; long: number };
}

export function calculateRegionBounds(
  centerLat: number,
  centerLong: number,
  radiusKm: number
): Bounds {
  // Calculate bounding box for drawing area
  // Given center point and radius in kilometers
  // Return bounds in lat/long coordinates
}
```

4. **Distance Calculator:**
```typescript
export function haversineDistance(
  lat1: number,
  long1: number,
  lat2: number,
  long2: number
): number {
  // Calculate distance between two points on sphere
  // Return distance in kilometers
  // Use Haversine formula
}
```

5. **Zoom Level to Radius:**
```typescript
export function zoomLevelToRadius(zoomLevel: number): number {
  // Convert zoom level (1-20) to drawing area radius
  // Higher zoom = smaller radius = more detailed drawing
  const maxRadius = 500; // km at zoom level 1
  const minRadius = 10;  // km at zoom level 20
  return maxRadius / Math.pow(2, zoomLevel - 1);
}
```

6. **Location Name Resolver (Optional):**
```typescript
export async function getLocationName(lat: number, long: number): Promise<string> {
  // Use reverse geocoding API (e.g., OpenStreetMap Nominatim)
  // Return city/country name
  // For display in UI: "Drawing over: Tokyo, Japan"
}
```

Please implement with:
- TypeScript types
- JSDoc comments
- Error handling
- Unit test examples in comments
```

---

## Day 4-5: Drawing Canvas System

### 💻 PROMPT FOR AI - DRAWING CANVAS:

```
Create the 2D drawing canvas component for Ploxel 3D.

FILE: src/components/DrawingCanvas.tsx

REQUIREMENTS:

1. Create a React component that provides a 2D drawing interface:

```typescript
interface DrawingCanvasProps {
  bounds: Bounds;           // Region being drawn on
  onComplete: (imageData: string) => void;  // Returns base64 PNG
  onCancel: () => void;
}

export default function DrawingCanvas({ bounds, onComplete, onCancel }: DrawingCanvasProps) {
  // Implementation
}
```

2. CANVAS SETUP:
   - HTML5 Canvas element
   - Fixed size: 1024x1024 pixels (high quality)
   - Responsive container (scales to viewport)
   - White background for visibility

3. DRAWING STATE:
```typescript
interface DrawingState {
  tool: 'pencil' | 'brush' | 'eraser';
  color: string;
  brushSize: number;
  isDrawing: boolean;
}
```

4. DRAWING TOOLS:

a) **Pencil:**
   - Thin line (2-5px)
   - Hard edges
   - Full opacity

b) **Brush:**
   - Thicker line (5-50px adjustable)
   - Soft edges (slight blur)
   - Full opacity

c) **Eraser:**
   - Clear to transparent
   - Size adjustable (5-50px)

5. MOUSE/TOUCH EVENT HANDLERS:
```typescript
const handleMouseDown = (e: React.MouseEvent) => {
  // Start drawing
  // Get canvas coordinates
  // Begin path
};

const handleMouseMove = (e: React.MouseEvent) => {
  // Continue drawing if mouse down
  // Add to path
  // Render stroke
};

const handleMouseUp = () => {
  // End drawing
  // Finalize path
};

// Also implement touch events for mobile
```

6. DRAWING IMPLEMENTATION:
```typescript
const draw = (x: number, y: number) => {
  const ctx = canvasRef.current?.getContext('2d');
  if (!ctx) return;
  
  ctx.lineWidth = brushSize;
  ctx.strokeStyle = tool === 'eraser' ? 'rgba(255,255,255,1)' : color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  } else {
    ctx.globalCompositeOperation = 'source-over';
  }
  
  ctx.lineTo(x, y);
  ctx.stroke();
};
```

7. EXPORT FUNCTIONALITY:
```typescript
const exportDrawing = (): string => {
  const canvas = canvasRef.current;
  if (!canvas) return '';
  
  // Convert to PNG with transparency
  return canvas.toDataURL('image/png');
};
```

8. UI CONTROLS:
   - Tool selector buttons (pencil, brush, eraser)
   - Color picker (use HTML5 input type="color")
   - Brush size slider (1-50px)
   - Clear button (reset canvas)
   - Cancel button (exit without saving)
   - Stamp button (finalize and save)

9. PERFORMANCE:
   - Debounce rapid mouse movements
   - Use requestAnimationFrame for smooth rendering
   - Optimize canvas operations

Please implement with TypeScript, responsive design, and smooth drawing experience.
```

---

### 💻 PROMPT FOR AI - DRAWING TOOLS UI:

```
Create the drawing tools interface component.

FILE: src/components/DrawingTools.tsx

REQUIREMENTS:

1. Component interface:
```typescript
interface DrawingToolsProps {
  currentTool: 'pencil' | 'brush' | 'eraser';
  currentColor: string;
  brushSize: number;
  onToolChange: (tool: 'pencil' | 'brush' | 'eraser') => void;
  onColorChange: (color: string) => void;
  onBrushSizeChange: (size: number) => void;
  onClear: () => void;
}
```

2. TOOL BUTTONS:
   - Pencil icon button
   - Brush icon button
   - Eraser icon button
   - Active state highlight (neon cyan border)
   - Hover effects

3. COLOR PICKER:
   - HTML5 color input
   - Show current color swatch
   - Common color presets:
     * Black (#000000)
     * White (#FFFFFF)
     * Red (#FF0000)
     * Blue (#0000FF)
     * Green (#00FF00)
     * Yellow (#FFFF00)

4. BRUSH SIZE SLIDER:
   - Range input: 1-50
   - Display current size number
   - Visual preview of brush size

5. CLEAR BUTTON:
   - Red warning color
   - Confirmation modal: "Clear all your work?"
   - Icon: trash can

6. STYLING:
   - Dark background (rgba(0,0,0,0.8))
   - Neon cyan accents for active states
   - Glassmorphism effect
   - Smooth transitions

7. LAYOUT:
```tsx
<div className="drawing-tools">
  <div className="tool-group">
    {/* Tool buttons */}
  </div>
  
  <div className="color-group">
    {/* Color picker */}
  </div>
  
  <div className="size-group">
    {/* Brush size slider */}
  </div>
  
  <div className="actions">
    {/* Clear button */}
  </div>
</div>
```

Please implement with Tailwind CSS, TypeScript, and accessible UI.
```

---

# Week 2: Drawing System Integration

## Day 6-7: Stamp System & Storage

### 💻 PROMPT FOR AI - STAMP API ENDPOINT:

```
Create the API endpoint for stamping drawings onto the globe.

FILE: src/app/api/stamp/route.ts

REQUIREMENTS:

1. POST endpoint that:
   - Accepts drawing image data (base64 PNG)
   - Accepts bounds (lat/long coordinates)
   - Accepts user ID
   - Uploads image to Supabase Storage
   - Saves metadata to Supabase database
   - Returns drawing record

2. IMPLEMENTATION:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const { imageData, bounds, userId } = await request.json();
    
    // 1. Validate input
    if (!imageData || !bounds || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // 2. Convert base64 to buffer
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // 3. Upload to Supabase Storage
    const filename = `${userId}/${uuidv4()}.png`;
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('drawings')
      .upload(filename, buffer, {
        contentType: 'image/png',
        cacheControl: '3600'
      });
    
    if (uploadError) throw uploadError;
    
    // 4. Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('drawings')
      .getPublicUrl(filename);
    
    // 5. Save to database
    const { data: drawing, error: dbError } = await supabase
      .from('drawings')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        latitude: bounds.center.lat,
        longitude: bounds.center.long,
        bounds: bounds,
        enhanced: false
      })
      .select()
      .single();
    
    if (dbError) throw dbError;
    
    // 6. Log activity
    await supabase.from('activity').insert({
      drawing_id: drawing.id,
      user_id: userId,
      action: 'drawing_created',
      metadata: { location: bounds }
    });
    
    // Return success
    return NextResponse.json({ 
      success: true, 
      drawing 
    });
    
  } catch (error) {
    console.error('Stamp error:', error);
    return NextResponse.json(
      { error: 'Failed to stamp drawing' },
      { status: 500 }
    );
  }
}
```

3. ERROR HANDLING:
   - Validate image size (max 5MB)
   - Validate image format (PNG only)
   - Handle storage quota exceeded
   - Handle database errors
   - Rate limiting (max 10 stamps per hour per user)

4. RESPONSE FORMAT:
```typescript
{
  success: true,
  drawing: {
    id: "uuid",
    image_url: "https://...",
    latitude: 35.6762,
    longitude: 139.6503,
    bounds: {...},
    created_at: "2024-01-01T00:00:00Z"
  }
}
```

Please implement with complete error handling and validation.
```

---

### 💻 PROMPT FOR AI - REALTIME UPDATES:

```
Create the realtime subscription system for live drawing updates.

FILE: src/lib/realtime.ts

REQUIREMENTS:

1. Create a custom hook for subscribing to drawing updates:

```typescript
import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Drawing } from '@/types/drawing';

export function useRealtimeDrawings() {
  const [drawings, setDrawings] = useState<Drawing[]>([]);
  const [latestDrawing, setLatestDrawing] = useState<Drawing | null>(null);
  
  useEffect(() => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    // Subscribe to new drawings
    const channel = supabase
      .channel('drawings')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'drawings'
        },
        (payload) => {
          const newDrawing = payload.new as Drawing;
          setDrawings(prev => [newDrawing, ...prev]);
          setLatestDrawing(newDrawing);
          
          // Trigger globe texture update
          updateGlobeTexture(newDrawing);
        }
      )
      .subscribe();
    
    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  return { drawings, latestDrawing };
}
```

2. GLOBE TEXTURE UPDATE FUNCTION:
```typescript
function updateGlobeTexture(drawing: Drawing) {
  // This will be called when new drawing is received
  // Implementation depends on how you're managing globe texture
  // Options:
  // A) Composite drawing onto texture client-side
  // B) Reload entire texture from server
  // C) Use WebGL shader to overlay drawing
}
```

3. REGION-BASED SUBSCRIPTIONS:
```typescript
export function useRegionalDrawings(bounds: Bounds) {
  // Subscribe only to drawings within specific region
  // Reduce unnecessary updates
  // Filter by latitude/longitude range
}
```

4. ACTIVITY FEED SUBSCRIPTION:
```typescript
export function useActivityFeed(limit: number = 50) {
  const [activities, setActivities] = useState<Activity[]>([]);
  
  useEffect(() => {
    // Subscribe to activity table
    // Display latest 50 activities
    // Real-time updates for new activity
  }, []);
  
  return activities;
}
```

5. CONNECTION STATUS:
```typescript
export function useRealtimeStatus() {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');
  
  // Monitor realtime connection status
  // Show indicator in UI
  
  return status;
}
```

Please implement with TypeScript, error handling, and automatic reconnection.
```

---

## Day 8-9: Activity Feed Component

### 💻 PROMPT FOR AI - ACTIVITY FEED:

```
Create the activity feed sidebar component.

FILE: src/components/ActivityFeed.tsx

REQUIREMENTS:

1. Component that displays recent drawing activity:

```typescript
import { useActivityFeed } from '@/lib/realtime';
import { formatDistance } from 'date-fns';

export default function ActivityFeed() {
  const activities = useActivityFeed(50);
  
  return (
    <div className="activity-feed">
      <h3>Live Activity</h3>
      <div className="activity-list">
        {activities.map(activity => (
          <ActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}
```

2. ACTIVITY ITEM COMPONENT:
```typescript
function ActivityItem({ activity }: { activity: Activity }) {
  const message = formatActivityMessage(activity);
  const timeAgo = formatDistance(new Date(activity.created_at), new Date(), { 
    addSuffix: true 
  });
  
  return (
    <div className="activity-item">
      <div className="activity-icon">🎨</div>
      <div className="activity-content">
        <p>{message}</p>
        <span className="activity-time">{timeAgo}</span>
      </div>
    </div>
  );
}
```

3. MESSAGE FORMATTING:
```typescript
function formatActivityMessage(activity: Activity): string {
  const location = getLocationFromBounds(activity.metadata.location);
  
  switch (activity.action) {
    case 'drawing_created':
      return `New drawing in ${location}`;
    case 'drawing_enhanced':
      return `AI-enhanced art in ${location}`;
    default:
      return `Activity in ${location}`;
  }
}
```

4. LOCATION DISPLAY:
```typescript
async function getLocationFromBounds(bounds: Bounds): Promise<string> {
  // Use reverse geocoding or
  // Display coordinates if geocoding unavailable
  // Cache results to avoid repeated API calls
}
```

5. STYLING (Tailwind):
   - Fixed sidebar (right side)
   - Width: 300px
   - Dark background with glassmorphism
   - Scrollable list
   - Smooth animations for new items
   - Slide-in effect

6. AUTO-SCROLL:
   - New activities appear at top
   - Auto-scroll to show latest
   - Pause auto-scroll if user manually scrolls

7. CLICK TO NAVIGATE:
   - Click activity item to fly globe to that location
   - Highlight the drawing briefly

Please implement with Tailwind CSS, smooth animations, and responsive design.
```

---

# Week 3: AI Enhancement & Polish

## Day 10-11: AI Enhancement Feature

### 💻 PROMPT FOR AI - AI ENHANCE ENDPOINT:

```
Create the AI enhancement API endpoint using GPT-4 Vision.

FILE: src/app/api/enhance/route.ts

REQUIREMENTS:

1. POST endpoint that enhances user drawings using AI:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
  try {
    const { imageData, style } = await request.json();
    
    // Validate input
    if (!imageData) {
      return NextResponse.json(
        { error: 'Missing image data' },
        { status: 400 }
      );
    }
    
    // Initialize OpenAI
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Build prompt based on style
    const prompt = buildEnhancementPrompt(style);
    
    // Call DALL-E 3 for image enhancement
    const response = await openai.images.edit({
      image: imageDataToFile(imageData),
      prompt: prompt,
      n: 1,
      size: "1024x1024"
    });
    
    const enhancedImageUrl = response.data[0].url;
    
    // Return enhanced image
    return NextResponse.json({
      success: true,
      enhancedImageUrl
    });
    
  } catch (error) {
    console.error('AI enhancement error:', error);
    return NextResponse.json(
      { error: 'Failed to enhance image' },
      { status: 500 }
    );
  }
}

function buildEnhancementPrompt(style?: string): string {
  const basePrompt = "Enhance this drawing to make it more artistic and visually appealing while maintaining the original content and intent.";
  
  if (!style) return basePrompt;
  
  const stylePrompts = {
    watercolor: "Transform into a beautiful watercolor painting",
    pixelart: "Convert to high-quality pixel art style",
    sketch: "Refine into a professional pencil sketch",
    vibrant: "Enhance with vibrant, saturated colors and bold lines"
  };
  
  return stylePrompts[style] || basePrompt;
}
```

2. RATE LIMITING:
   - Max 3 enhancements per user per day
   - Track usage in database or Redis
   - Return clear error when limit exceeded

3. ERROR HANDLING:
   - Handle OpenAI API errors
   - Validate image format and size
   - Timeout after 30 seconds
   - Fallback: return original if enhancement fails

4. COST TRACKING:
   - Log each API call
   - Monitor monthly costs
   - Set budget alerts

Please implement with error handling, rate limiting, and cost optimization.
```

---

### 💻 PROMPT FOR AI - AI ENHANCE BUTTON:

```
Create the AI enhancement UI component.

FILE: src/components/AIEnhanceButton.tsx

REQUIREMENTS:

1. Component interface:
```typescript
interface AIEnhanceButtonProps {
  imageData: string;  // Current drawing
  onEnhanced: (enhancedImageData: string) => void;
  disabled?: boolean;
}

export default function AIEnhanceButton({ 
  imageData, 
  onEnhanced, 
  disabled 
}: AIEnhanceButtonProps) {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [showStylePicker, setShowStylePicker] = useState(false);
  
  // Implementation
}
```

2. STYLE PICKER MODAL:
```typescript
const styles = [
  { id: 'none', name: 'Natural Enhancement', icon: '✨' },
  { id: 'watercolor', name: 'Watercolor', icon: '🎨' },
  { id: 'pixelart', name: 'Pixel Art', icon: '👾' },
  { id: 'sketch', name: 'Sketch', icon: '✏️' },
  { id: 'vibrant', name: 'Vibrant', icon: '🌈' }
];
```

3. ENHANCEMENT FLOW:
```typescript
const handleEnhance = async (styleId: string) => {
  setIsEnhancing(true);
  
  try {
    const response = await fetch('/api/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        imageData, 
        style: styleId 
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Fetch enhanced image and convert to base64
      const enhancedImage = await fetchImageAsBase64(data.enhancedImageUrl);
      onEnhanced(enhancedImage);
    }
  } catch (error) {
    console.error('Enhancement failed:', error);
    alert('Failed to enhance image. Please try again.');
  } finally {
    setIsEnhancing(false);
    setShowStylePicker(false);
  }
};
```

4. UI DESIGN:
   - Primary button: "✨ AI Enhance"
   - Loading state: Animated sparkles
   - Style picker: Modal with grid of style options
   - Preview: Show before/after comparison
   - Undo: Revert to original

5. RATE LIMIT WARNING:
   - Show remaining enhancements today
   - "2/3 enhancements left today"
   - Disable when limit reached
   - Suggest premium upgrade

Please implement with TypeScript, smooth UX, and clear loading states.
```

---

## Day 12-14: Integration & Testing

### Complete Integration Tasks:

1. **Connect all components:**
   - Globe → DrawingCanvas → Stamp → Realtime Updates
   - Test full user flow

2. **Performance optimization:**
   - Lazy load Three.js
   - Optimize texture sizes
   - Debounce realtime updates

3. **Mobile responsiveness:**
   - Touch controls for globe
   - Touch drawing on canvas
   - Responsive sidebar

4. **Error handling:**
   - Network failures
   - Storage quota exceeded
   - Database errors
   - API rate limits

---

# Week 4: Polish & Launch

## Day 15-16: UI Polish

### Tasks:
1. Animations (Framer Motion)
2. Loading states
3. Error messages
4. Success notifications
5. Tooltips and help text

## Day 17-18: Testing

### Test Cases:
- [ ] Globe loads and rotates smoothly
- [ ] Drawing tools work on all devices
- [ ] Stamping saves to database
- [ ] Real-time updates appear for all users
- [ ] AI enhancement works
- [ ] Activity feed updates in real-time

## Day 19-20: Deployment

### Deployment Checklist:
1. Deploy to Vercel
2. Configure Supabase production
3. Set up Cloudflare R2
4. Configure environment variables
5. Test in production

## Day 21: Launch!

### Launch Tasks:
1. Create demo video
2. Write social media posts
3. Submit to ProductHunt
4. Share on Twitter/Reddit
5. Monitor for issues

---

# 🎯 Success Criteria

MVP is ready when:

✅ Globe renders and is interactive  
✅ Users can draw on regions  
✅ Stamping places drawings on globe  
✅ Real-time updates work globally  
✅ AI enhancement produces good results  
✅ Activity feed shows recent activity  
✅ No major bugs  
✅ Mobile-responsive  
✅ Load time < 3 seconds

---

**Let's build the future of collaborative 3D art! 🌍🎨✨**
