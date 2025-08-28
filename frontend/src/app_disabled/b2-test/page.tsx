import B2UploadTest from '../../components/B2UploadTest';

export default function B2TestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            B2 Cloud Storage Integration Test
          </h1>
          <p className="text-gray-600">
            Test the Backblaze B2 Cloud Storage integration for profile picture uploads
          </p>
        </div>
        
        <B2UploadTest />
        
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Integration Features</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">✅ Backend Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• B2 Cloud Storage integration</li>
                  <li>• Image compression with Sharp</li>
                  <li>• Automatic file overwriting</li>
                  <li>• Signed URL generation</li>
                  <li>• Rate limiting protection</li>
                  <li>• File validation & security</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">✅ Frontend Features</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Client-side image compression</li>
                  <li>• Real-time preview generation</li>
                  <li>• File validation & error handling</li>
                  <li>• Progress feedback</li>
                  <li>• Secure authentication</li>
                  <li>• Responsive UI design</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 