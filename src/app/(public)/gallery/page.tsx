import type { Metadata } from 'next'

import { getPublicGallery } from '@/server/catalogue'
import { GallerySection } from '@/components/gallery/GallerySection'

export const metadata: Metadata = {
  title: 'Galerie',
  description: 'Ein Blick in das Viet Rice — Restaurant, Sushi Bar, Private Room und Terrasse.',
}

export default async function GalleryPage() {
  const items = await getPublicGallery()

  return (
      <>
      <GallerySection items={items} />
    </>
  )
}
