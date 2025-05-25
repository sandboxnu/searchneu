import Link from "next/link";

export function Footer() {
  return (
    <footer className="flex h-16 justify-between p-2">
      <div className="flex h-full flex-col justify-center">
        <p>
          Made with ❤️ by{" "}
          <a
            href="https://www.sandboxnu.com/"
            className="text-blue hover:text-blue/80"
          >
            Sandbox
          </a>
        </p>
      </div>
      <div className="flex flex-col">
        <div className="flex justify-end gap-2">
          <Link href="" className="text-blue hover:text-blue/80">
            Feedback
          </Link>
          <p>·</p>
          <Link href="/docs" className="text-blue hover:text-blue/80">
            Docs
          </Link>
          <p>·</p>
          <Link href="/terms" className="text-blue hover:text-blue/80">
            Terms of Service
          </Link>
          <p>·</p>
          <Link href="/privacy" className="text-blue hover:text-blue/80">
            Privacy Policy
          </Link>
          <p>·</p>
          <p>©2025 SearchNEU</p>
        </div>

        <p className="text-right text-sm">
          Search NEU is built for students by students and is not affiliated
          with NEU
        </p>
      </div>
    </footer>
  );
}
