import { Loader2 } from 'lucide-react';

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full w-full absolute top-0 left-0 bg-gray-900 bg-opacity-50 z-50">
        <Loader2 className="animate-spin text-white h-16 w-16" />
    </div>
);

export default LoadingSpinner;
