export default function PortalHome() {
  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Welcome to the Portal</h2>
          <p className="text-gray-600 mb-4">
            This is your client portal dashboard. You can navigate to different sections using the sidebar.
          </p>
          <p className="text-gray-600">
            Check out our <a href="/portal/components" className="text-blue-600 hover:underline">component library</a> to see all available UI components.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg border">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <ul className="space-y-2 text-gray-600">
            <li>• Explore the dashboard</li>
            <li>• View your projects</li>
            <li>• Check the component library</li>
            <li>• Update your profile settings</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
