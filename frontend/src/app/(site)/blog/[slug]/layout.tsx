interface BlogDetailsLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default function BlogDetailsLayout({
  children,
  params,
}: BlogDetailsLayoutProps) {
  void params;
  return <>{children}</>;
}
