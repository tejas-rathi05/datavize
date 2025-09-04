'use client'

export function EnvCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return (
      <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50">
        <h3 className="font-bold">Environment Error</h3>
        <p className="text-sm">
          Missing Supabase environment variables. Please check your .env.local file.
        </p>
        <div className="mt-2 text-xs">
          <p>URL: {supabaseUrl ? '✅ Set' : '❌ Missing'}</p>
          <p>Key: {supabaseKey ? '✅ Set' : '❌ Missing'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50">
      <h3 className="font-bold">Environment OK</h3>
      <p className="text-sm">Supabase configured correctly</p>
      <div className="mt-2 text-xs">
        <p>URL: {supabaseUrl.substring(0, 30)}...</p>
        <p>Key: {supabaseKey.substring(0, 20)}...</p>
      </div>
    </div>
  )
}
