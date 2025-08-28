
import { getDocuments } from './actions';
import { getCases } from '../cases/actions';
import { getAccounts } from '../accounts/actions';
import type { Document, Case, Account } from '@/lib/types';
import { DocumentsClient } from './documents-client';

export default async function DocumentsPage() {
    
    // Fetch all required data on the server for a fast initial load.
    const initialDocuments: Document[] = await getDocuments();
    const initialCases: Case[] = await getCases();
    const initialAccounts: Account[] = await getAccounts();

    // Pass the server-fetched data to the interactive client component.
    return (
        <DocumentsClient
            initialDocuments={initialDocuments}
            initialCases={initialCases}
            initialAccounts={initialAccounts}
        />
    );
}
