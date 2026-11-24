import { Storefront } from '@/components/storefront'
import { PREVIEW_PACKAGES } from '@/lib/catalog'
import { getStorePackages } from '@/lib/packages'
import { getStoreReviews, PREVIEW_REVIEWS } from '@/lib/reviews'

export const dynamic = 'force-dynamic'

export default async function Page() {
  let packages = PREVIEW_PACKAGES
  let reviews = PREVIEW_REVIEWS

  try {
    [packages, reviews] = await Promise.all([getStorePackages(), getStoreReviews()])
  } catch {
    packages = PREVIEW_PACKAGES
    reviews = PREVIEW_REVIEWS
  }

  return <Storefront packages={packages} reviews={reviews} />
}
