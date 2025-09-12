import { LucideMousePointerClick } from 'lucide-react'
import React from 'react'

const EmptyCanvas = () => {
  return (
    <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 justify-center items-center'>
        <LucideMousePointerClick size={40} className='text-muted-foreground' />
        <h3 className='text-center text-2xl text-muted-foreground'>Drag and drop to get Started</h3>
    </div>
  )
}

export default EmptyCanvas