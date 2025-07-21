
import ChatComponent from './ChatComponent';

const matchDetails = {
  '1': {
    name: 'Priya Sharma',
    image: '/demo-profiles/match-1.svg'
  },
  '2': {
    name: 'Kavya Reddy',
    image: '/demo-profiles/match-2.svg'
  }
};

export async function generateStaticParams() {
  return [
    { id: '1' },
    { id: '2' },
  ];
}

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const match = matchDetails[resolvedParams.id as keyof typeof matchDetails];

  if (!match) {
    return <div>Match not found</div>;
  }

  return <ChatComponent match={match} />;
}
