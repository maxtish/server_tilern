export interface NewsSource {
  id: string | null;
  name: string;
  url: string;
  country?: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content: string;
  url: string;
  image: string;
  publishedAt: string;
  lang: string;
  source: NewsSource;
}

export interface NewsApiResponse {
  totalArticles: number;
  articles: NewsArticle[];
}
