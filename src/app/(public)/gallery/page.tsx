import type { Metadata } from 'next'

import { galleryItems } from '@/content/gallery'
import { GallerySection } from '@/components/gallery/GallerySection'

export const metadata: Metadata = {
  title: 'Galerie',
  description: 'Ein Blick in das Viet Rice — Restaurant, Sushi Bar, Private Room und Terrasse.',
}

export default function GalleryPage() {
  return (
      <>
      <GallerySection items={galleryItems} />
    </>
  )
}
