export default function LoadingSkeleton({ count = 3, type = 'card', className = '' }) {
  const getSkeletonClass = () => {
    switch (type) {
      case 'card':
        return 'h-64 rounded-xl'
      case 'row':
        return 'h-12 rounded-lg mb-3'
      case 'text':
        return 'h-4 rounded mb-2'
      default:
        return 'h-20 rounded-lg'
    }
  }

  const skeletonClass = getSkeletonClass()

  return (
    <div className={className}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className={`${skeletonClass} bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 animate-shimmer`} 
             style={{ backgroundSize: '200% 100%' }} />
      ))}
    </div>
  )
}
