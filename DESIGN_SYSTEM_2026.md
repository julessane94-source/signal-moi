# 🎨 Guide de Style Signal-Moi 2026

**Dernière mise à jour:** 3 juin 2026

## 📋 Table des matières
1. [Système de couleurs](#système-de-couleurs)
2. [Typographie](#typographie)
3. [Composants](#composants)
4. [Animations](#animations)
5. [Accessibilité](#accessibilité)
6. [Patterns](#patterns)

---

## Système de couleurs

### Palette primaire
- **Indigo** (Trust, Action): #6366f1
  - Light: #818cf8
  - Dark: #4338ca
- **Cyan** (Accent): #06b6d4
- **Orange** (Alerts): #f97316 (intentionally NOT red)

### Palette sémantique
- **Succès** (Green): #10b981
- **Warning** (Yellow): #f59e0b
- **Danger** (Orange): #f97316
- **Info** (Blue): #3b82f6

### Utilisation
```jsx
// Primary gradient
className="bg-gradient-to-r from-indigo-600 to-cyan-500"

// Text gradient
className="text-gradient-primary"

// Semantic colors
className="bg-success-500" // Green
className="bg-warning-500" // Yellow
className="bg-danger-500"  // Orange (not red!)
```

---

## Typographie

### Font Stack
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Hiérarchie
- **H1**: 36-96px, font-black (hero titles)
- **H2**: 28-48px, font-bold (section titles)
- **H3**: 20-28px, font-semibold (card titles)
- **Body**: 16px, font-normal (default)
- **Small**: 12-14px, font-medium (metadata)

### Utilisation
```jsx
// Title
className="text-4xl md:text-5xl font-black text-slate-900"

// Subtitle
className="text-xl font-semibold text-slate-700"

// Body text
className="text-base font-normal text-slate-600"

// Small text
className="text-sm font-medium text-slate-500"
```

---

## Composants

### Button (Enhanced)
```jsx
import { Button } from '@/components/ui'

// Variants
<Button variant="primary">Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Link-like</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// States
<Button disabled>Disabled</Button>
<Button loading>Loading</Button>
```

### Card (Glass-morphism)
```jsx
import { Card } from '@/components/ui'

<Card hover shadow="lg">
  <h3 className="text-xl font-semibold">Title</h3>
  <p className="text-gray-600">Content</p>
</Card>
```

### EmptyState (New)
```jsx
import { EmptyState } from '@/components/ui'

<EmptyState 
  icon="📭"
  title="No items found"
  description="Try adjusting your search"
  action={<Button>Create new</Button>}
/>
```

### LoadingSkeleton (New)
```jsx
import { LoadingSkeleton } from '@/components/ui'

// Card skeletons
<LoadingSkeleton count={3} type="card" />

// Row skeletons
<LoadingSkeleton count={5} type="row" />

// Text skeletons
<LoadingSkeleton count={3} type="text" />
```

### Breadcrumb (New)
```jsx
import { Breadcrumb } from '@/components/ui'

<Breadcrumb items={[
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/admin/dashboard' },
  { label: 'Settings' }
]} />
```

### StatusBadge (New)
```jsx
import { StatusBadge } from '@/components/ui'

// Preset statuses
<StatusBadge status="pending" />    // ⏳ En attente
<StatusBadge status="progress" />   // 🔄 En cours
<StatusBadge status="resolved" />   // ✅ Résolu
<StatusBadge status="rejected" />   // ❌ Rejeté

// Custom status
<StatusBadge custom={{
  bg: 'bg-purple-100',
  text: 'text-purple-800',
  dot: 'bg-purple-500',
  label: '🎨 Custom'
}} />
```

---

## Animations

### Disponibles (via Tailwind + Framer Motion)

#### CSS Animations
```css
/* Fade in */
.fade-in { animation: fadeIn 0.6s ease-in-out; }

/* Slide up */
.slide-up { animation: slideUp 0.5s ease-out; }

/* Shimmer (loading) */
.animate-shimmer { animation: shimmer 2s infinite; }

/* Pulse, bounce, spin (Tailwind built-in) */
.animate-pulse
.animate-bounce
.animate-spin
```

#### Framer Motion
```jsx
import { motion } from 'framer-motion'

// Hover animation
<motion.div whileHover={{ y: -4, shadow: 'card-hover' }}>
  Card content
</motion.div>

// Tap animation
<motion.button whileTap={{ scale: 0.95 }}>
  Click me
</motion.button>

// Entrance animation
<motion.div 
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content
</motion.div>
```

### Utilisation dans les pages
```jsx
// Page entrance
<motion.main 
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
>
  Content
</motion.main>

// Card grid
<motion.div 
  className="grid md:grid-cols-3 gap-6"
  initial="hidden"
  animate="visible"
  variants={{
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }}
>
  {items.map(item => (
    <motion.div
      key={item.id}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
    >
      <Card>{item.content}</Card>
    </motion.div>
  ))}
</motion.div>
```

---

## Accessibilité

### Directives
1. **Contraste de couleurs**: Ratio 4.5:1 minimum pour le texte
2. **Focus visible**: `outline-2 ring-indigo-500`
3. **Réduction de mouvement**: Respecter `prefers-reduced-motion`
4. **Sémantique HTML**: Utiliser les bons éléments (`<button>`, `<nav>`, etc.)
5. **Labels**: Tous les inputs doivent avoir des labels

### Exemple
```jsx
// Accessible button
<button
  onClick={handleClick}
  className="px-4 py-2 rounded-lg bg-indigo-600 text-white 
             focus:outline-none focus:ring-2 focus:ring-indigo-500 
             focus:ring-offset-2 transition-all"
  aria-label="Delete item"
>
  Delete
</button>

// Accessible form
<label htmlFor="email" className="block text-sm font-medium mb-2">
  Email
</label>
<input
  id="email"
  type="email"
  required
  className="input-enhanced"
  aria-describedby="email-error"
/>
<p id="email-error" className="text-danger-500 text-sm mt-1">
  Email is required
</p>
```

---

## Patterns

### Hero Section (Homepage)
```jsx
<section className="relative overflow-hidden 
  bg-[linear-gradient(135deg,#0f172a_0%,#1e293b_45%,#2563eb_100%)] 
  text-white">
  <div className="absolute inset-0 
    bg-[radial-gradient(circle_at_top_left,_rgba(129,140,248,0.25),_transparent_20%),
    radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.18),_transparent_25%)]" />
  <div className="relative max-w-7xl mx-auto px-6 py-24">
    {/* Hero content */}
  </div>
</section>
```

### Data Table (Modern)
```jsx
<div className="overflow-x-auto">
  <table className="table-modern">
    <thead>
      <tr>
        <th className="px-4 py-3 text-left">Column 1</th>
        <th className="px-4 py-3 text-left">Column 2</th>
      </tr>
    </thead>
    <tbody>
      {data.map(row => (
        <tr key={row.id} className="hover:bg-slate-50 transition">
          <td className="px-4 py-3">{row.col1}</td>
          <td className="px-4 py-3">{row.col2}</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
```

### Modal (Enhanced)
```jsx
<motion.div 
  className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>
  <motion.div 
    className="modal-enhanced bg-white rounded-3xl shadow-xl-glow"
    initial={{ scale: 0.95, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
  >
    <div className="modal-header p-6 border-b">
      <h2>Modal Title</h2>
    </div>
    <div className="p-6">
      {/* Content */}
    </div>
  </motion.div>
</motion.div>
```

### Form (Enhanced)
```jsx
<form className="space-y-6">
  <FormField 
    label="Email" 
    error={errors.email}
    required
  >
    <input 
      type="email" 
      className="input-enhanced"
      required 
    />
  </FormField>

  <FormField 
    label="Message" 
    error={errors.message}
  >
    <textarea 
      className="input-enhanced h-32 resize-none"
      placeholder="Your message..."
    />
  </FormField>

  <Button type="submit" variant="primary" size="lg">
    Submit
  </Button>
</form>
```

---

## Checklist pour les nouvelles pages

- [ ] Importer les animations nécessaires (Framer Motion)
- [ ] Utiliser les composants de base (Button, Card, etc.)
- [ ] Appliquer les animations d'entrée (fade-in, slide-up)
- [ ] Ajouter des états vides (EmptyState) pour les listes
- [ ] Ajouter des états de chargement (LoadingSkeleton)
- [ ] Respecter la hiérarchie typographique
- [ ] Utiliser la palette de couleurs cohérente
- [ ] Tester l'accessibilité (contraste, focus, keyboard nav)
- [ ] Optimiser pour mobile (responsive)
- [ ] Tester les transitions de page

---

## Resources

- **Tailwind CSS**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion
- **Heroicons**: https://heroicons.com
- **Accessibility**: https://www.w3.org/WAI/WCAG21/quickref/

---

**Version**: 1.0 | **Author**: Design System Team | **Updated**: 3 June 2026
