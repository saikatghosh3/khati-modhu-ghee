import { Storefront } from '@/components/storefront'
import { PREVIEW_PACKAGES } from '@/lib/catalog'
import { getStorePackages } from '@/lib/packages'

export const dynamic = 'force-dynamic'

export default async function Page() {
  let packages = PREVIEW_PACKAGES

  try {
    packages = await getStorePackages()
  } catch {
    packages = PREVIEW_PACKAGES
  }

  return <Storefront packages={packages} />
}
