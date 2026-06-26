import Image from "next/image";
import {
  BarChart3,
  Calendar,
  Bell,
  BookOpen,
  TrendingUp,
  Target,
  Download,
  FolderGit2,
  ExternalLink,
} from "lucide-react";

async function getLatestRelease() {
  try {
    const res = await fetch(
      "https://api.github.com/repos/TECHTUNE-I-T-SOLUTIONS/Ace/releases/latest",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const apkAsset = data.assets?.find((asset: any) =>
      asset.name.endsWith(".apk")
    );
    return {
      version: data.tag_name || data.name,
      url: data.html_url,
      downloadUrl: apkAsset?.browser_download_url || null,
      publishedAt: data.published_at,
      notes: data.body,
    };
  } catch (error) {
    console.error("Failed to fetch release:", error);
    return null;
  }
}

const features = [
  {
    icon: BarChart3,
    title: "Grade Tracking",
    description:
      "Monitor your academic performance with detailed grade analytics and GPA calculations.",
  },
  {
    icon: Calendar,
    title: "Assignment Management",
    description:
      "Never miss a deadline with smart assignment tracking and reminders.",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    description:
      "Get timely alerts for exams, assignments, and important academic events.",
  },
  {
    icon: BookOpen,
    title: "Course Organization",
    description:
      "Keep all your courses, notes, and study materials in one place.",
  },
  {
    icon: TrendingUp,
    title: "Progress Analytics",
    description:
      "Visualize your academic journey with detailed insights and reports.",
  },
  {
    icon: Target,
    title: "Study Planning",
    description:
      "Plan your study sessions effectively with integrated scheduling tools.",
  },
];

export default async function Home() {
  const release = await getLatestRelease();

  return (
    <div className="flex flex-col flex-1 bg-gradient-to-br from-blue-400 via-slate-400 to-black dark:from-blue-400 dark:via-blue-950 dark:to-gray-800">
      {/* Header */}
      <header className="w-full py-6 px-6 sm:px-16 lg:px-24">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10">
              <Image
                src="/logo.png"
                alt="ACE Logo"
                fill
                className="object-contain"
                sizes="40px"
              />
            </div>
            <span className="text-xl font-bold text-white">ACE</span>
          </div>
          <nav className="flex items-center gap-6">
            <a
              href="https://github.com/TECHTUNE-I-T-SOLUTIONS/Ace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-2"
            >
              <FolderGit2 className="w-5 h-5" />
              <span className="hidden sm:inline">GitHub</span>
            </a>
            {release?.downloadUrl && (
              <a
                href={release.downloadUrl}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-full transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </a>
            )}
          </nav>
        </div>
      </header>

      <main className="flex flex-1 w-full flex-col items-center justify-between px-6 py-20 sm:px-16 lg:px-24">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center gap-8 max-w-4xl mx-auto">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40">
            <Image
              src="/logo.png"
              alt="ACE Logo"
              fill
              className="object-contain drop-shadow-2xl"
              priority
              sizes="(max-width: 640px) 128px, 160px"
            />
          </div>

          <div className="space-y-4">
            <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-white">
              ACE
            </h1>
            <p className="text-xl sm:text-2xl text-blue-200 font-medium">
              Your Academic Companion
            </p>
            <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              Stay organized, track your grades, manage assignments, and ace your
              studies. ACE brings all your academic life into one powerful app.
            </p>
          </div>

          {/* Download Button */}
          {release?.downloadUrl ? (
            <a
              href={release.downloadUrl}
              className="mt-8 inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              <Download className="w-6 h-6" />
              Download APK (v{release.version})
            </a>
          ) : (
            <div className="mt-8 px-8 py-4 bg-slate-800 text-slate-400 font-medium rounded-full">
              Download coming soon
            </div>
          )}

          {release?.publishedAt && (
            <p className="text-sm text-slate-400">
              Last updated: {new Date(release.publishedAt).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto mt-24 w-full">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-300 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-24 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} ACE. Built for students, by students.</p>
          <div className="flex gap-6 justify-center mt-4">
            <a
              href="https://github.com/TECHTUNE-I-T-SOLUTIONS/Ace"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <FolderGit2 className="w-4 h-4" />
              GitHub
            </a>
            <a
              href="https://github.com/TECHTUNE-I-T-SOLUTIONS/Ace/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Releases
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}