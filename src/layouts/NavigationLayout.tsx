import { Disclosure } from '@headlessui/react'
import SideNavigation from '../components/navigation/SideNavigation'
import { MessagePanel } from '../components/panels/MessagePanel'

export const NavigationLayout: React.FC<{
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
}> = ({ setOpen }) => {
  return (
    <Disclosure as={'div'} className={'flex gap-12 relative overflow-y'}>
      {({ open }) => (
        <>
          <SideNavigation open={open} />
          <MessagePanel open={open} setOpen={setOpen} />
        </>
      )}
    </Disclosure>
  )
}
