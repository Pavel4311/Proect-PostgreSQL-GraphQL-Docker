// Этот файл содержит определения типов и интерфейсов, используемых в проекте.
// Например, для описания структуры данных, которые будут храниться в базе данных.

export interface User {
  id: number;
  username: string;
  email: string;
  password: string;
}

export interface Post {
  id: number;
  title: string;
  content: string;
  userId: number;
}

export interface Comment {
  id: number;
  postId: number;
  content: string;
  userId: number;
}
