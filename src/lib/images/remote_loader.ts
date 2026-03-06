import type { ImageLoader } from 'next/image';

export const remoteImageLoader: ImageLoader = ({ src }) => src;
