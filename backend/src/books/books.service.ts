import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class BooksService {
    private readonly KAKAO_API_URL = 'https://dapi.kakao.com/v3/search/book';

    async search(query: string) {
        const kakaoClientId = process.env.KAKAO_CLIENT_ID;
        console.log('--- Book Search Attempt ---');
        console.log('Query:', query);
        console.log('KAKAO_CLIENT_ID (first 5 chars):', kakaoClientId?.substring(0, 5) || 'MISSING');

        if (!kakaoClientId || kakaoClientId === 'your_kakao_client_id') {
            console.log('Using mock books due to missing/default client ID');
            return this.getMockBooks(query);
        }

        try {
            console.log('Calling Kakao API...');
            const response = await axios.get(this.KAKAO_API_URL, {
                params: { query },
                headers: {
                    Authorization: `KakaoAK ${kakaoClientId}`,
                },
            });

            const documents = (response.data as any).documents;
            console.log(`Kakao API Success: Found ${documents?.length || 0} books`);

            if (!documents || documents.length === 0) {
                console.log('No documents found from Kakao.');
                return [];
            }

            return documents.map((book: any) => ({
                title: book.title,
                authors: book.authors,
                publisher: book.publisher,
                thumbnail: book.thumbnail,
                isbn: book.isbn,
                summary: book.contents,
            }));
        } catch (error: any) {
            console.error('Kakao API Error Details:');
            if (error.response) {
                console.error('Status:', error.response.status);
                console.error('Data:', JSON.stringify(error.response.data));
            } else {
                console.error('Message:', error.message);
            }
            // Fallback for demo
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
