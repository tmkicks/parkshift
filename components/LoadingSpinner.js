export default function LoadingSpinner({ message = "Loading...", size = "large", className = "" }) {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8", 
    large: "h-12 w-12",
    xlarge: "h-16 w-16"
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] bg-white dark:bg-gray-900 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-green-600 dark:border-green-400 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-400 text-sm">{message}</p>
      )}
    </div>
  );
}
