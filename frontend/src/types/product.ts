export type TProduct = {
  _id: string;
  name: string;
  price: number;
  images: string[];
  stock: number;
  category: {
    _id: string;
    name: string;
  };
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  imageAltText?: string;
  imageCoverAltText?: string;
  imageAltTexts?: string[];
  features: string[];
  dimensions: {
    width: number;
    height: number;
    length: number;
  };
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
};
