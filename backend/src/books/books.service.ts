import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BooksService {
    private readonly KAKAO_API_URL = 'https://dapi.kakao.com/v3/search/book';

    async search(query: string) {
        const kakaoClientId = process.env.KAKAO_CLIENT_ID;
        console.log('BooksService.search called with query:', query);
        console.log('KAKAO_CLIENT_ID length:', kakaoClientId?.length || 0);

        if (!kakaoClientId || kakaoClientId === 'your_kakao_client_id') {
            console.log('Using mock books...');
            return this.getMockBooks(query);
        }

        try {
            const response = await axios.get(this.KAKAO_API_URL, {
                params: {
                    query,
                },
                headers: {
                    Authorization: `KakaoAK ${kakaoClientId}`,
                },
            });

            const documents = (response.data as any).documents;
            console.log(`BooksService.search: Found ${documents?.length || 0} books`);

            if (!documents || documents.length === 0) {
                console.log('No documents found from Kakao. Falling back to mock if query matches.');
                const mocks = this.getMockBooks(query);
                if (mocks.length > 0) return mocks;
            }

            return (documents || []).map((book: any) => ({
                title: book.title,
                authors: book.authors,
                publisher: book.publisher,
                thumbnail: book.thumbnail,
                isbn: book.isbn,
            }));
        } catch (error: any) {
            console.error('BooksService.search: Kakao API Error:', error.response?.data || error.message);
            // Fallback to mock on error
            return this.getMockBooks(query);
        }
    }

    private getMockBooks(query: string) {
        const mockBooks = [
            {
                title: '어린왕자',
                authors: ['생텍쥐페리'],
                publisher: '열린책들',
                thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F1467038%3Fsignature%3Dbe78829c664e757d',
                isbn: '1234567890',
            },
            {
                title: '아낌없이 주는 나무',
                authors: ['쉘 실버스타인'],
                publisher: '시공주니어',
                thumbnail: 'https://search1.kakaocdn.net/thumb/R120x174.q85/?fname=http%3A%2F%2Ft1.daumcdn.net%2Flbook%2Fimage%2F537466%3Fsignature%3D6a928e08d65c3fd5',
                isbn: '0987654321',
            },
        ];

        return mockBooks.filter((book) => book.title.includes(query));
    }
}
