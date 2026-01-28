import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-4 py-12 sm:px-6 lg:w-2/3 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">{children}</div>
      </div>

      <div className="relative hidden lg:block lg:w-1/3">
        <Image
          src="/auth-img.webp"
          alt="Office workspace"
          fill
          className="object-cover object-bottom"
          // priority
          // unoptimized
        />
      </div>
    </div>
  );
}
