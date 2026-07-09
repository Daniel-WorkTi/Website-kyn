interface PageHeadingProps {
  title: string;
}

export default function PageHeading({ title }: PageHeadingProps) {
  return (
    <header className="page-heading">
      <h1 className="page-heading__title">{title.toUpperCase()}</h1>
    </header>
  );
}
