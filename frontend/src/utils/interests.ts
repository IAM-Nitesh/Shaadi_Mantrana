// Interest categories and options for user profiles

export interface Interest {
  id: string;
  name: string;
  category: string;
  icon?: string;
}

export interface InterestCategory {
  id: string;
  name: string;
  interests: Interest[];
}

export const interests: InterestCategory[] = [
  {
    id: 'hobbies',
    name: 'Hobbies & Activities',
    interests: [
      { id: 'reading', name: 'Reading', category: 'hobbies' },
      { id: 'cooking', name: 'Cooking', category: 'hobbies' },
      { id: 'gardening', name: 'Gardening', category: 'hobbies' },
      { id: 'photography', name: 'Photography', category: 'hobbies' },
      { id: 'painting', name: 'Painting', category: 'hobbies' },
      { id: 'dancing', name: 'Dancing', category: 'hobbies' },
      { id: 'singing', name: 'Singing', category: 'hobbies' },
      { id: 'writing', name: 'Writing', category: 'hobbies' },
      { id: 'crafts', name: 'Arts & Crafts', category: 'hobbies' },
    ]
  },
  {
    id: 'sports',
    name: 'Sports & Fitness',
    interests: [
      { id: 'yoga', name: 'Yoga', category: 'sports' },
      { id: 'gym', name: 'Gym/Fitness', category: 'sports' },
      { id: 'running', name: 'Running', category: 'sports' },
      { id: 'swimming', name: 'Swimming', category: 'sports' },
      { id: 'cricket', name: 'Cricket', category: 'sports' },
      { id: 'football', name: 'Football', category: 'sports' },
      { id: 'tennis', name: 'Tennis', category: 'sports' },
      { id: 'badminton', name: 'Badminton', category: 'sports' },
      { id: 'cycling', name: 'Cycling', category: 'sports' },
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    interests: [
      { id: 'movies', name: 'Movies', category: 'entertainment' },
      { id: 'music', name: 'Music', category: 'entertainment' },
      { id: 'theater', name: 'Theater', category: 'entertainment' },
      { id: 'concerts', name: 'Concerts', category: 'entertainment' },
      { id: 'gaming', name: 'Gaming', category: 'entertainment' },
      { id: 'tv-shows', name: 'TV Shows', category: 'entertainment' },
      { id: 'comedy', name: 'Comedy Shows', category: 'entertainment' },
    ]
  },
  {
    id: 'travel',
    name: 'Travel & Adventure',
    interests: [
      { id: 'traveling', name: 'Traveling', category: 'travel' },
      { id: 'hiking', name: 'Hiking', category: 'travel' },
      { id: 'camping', name: 'Camping', category: 'travel' },
      { id: 'adventure-sports', name: 'Adventure Sports', category: 'travel' },
      { id: 'beach', name: 'Beach Vacations', category: 'travel' },
      { id: 'mountains', name: 'Mountain Trips', category: 'travel' },
      { id: 'cultural-tours', name: 'Cultural Tours', category: 'travel' },
    ]
  },
  {
    id: 'food',
    name: 'Food & Dining',
    interests: [
      { id: 'fine-dining', name: 'Fine Dining', category: 'food' },
      { id: 'street-food', name: 'Street Food', category: 'food' },
      { id: 'vegetarian', name: 'Vegetarian Cuisine', category: 'food' },
      { id: 'international-cuisine', name: 'International Cuisine', category: 'food' },
      { id: 'baking', name: 'Baking', category: 'food' },
      { id: 'wine-tasting', name: 'Wine Tasting', category: 'food' },
    ]
  },
  {
    id: 'learning',
    name: 'Learning & Development',
    interests: [
      { id: 'languages', name: 'Learning Languages', category: 'learning' },
      { id: 'meditation', name: 'Meditation', category: 'learning' },
      { id: 'spirituality', name: 'Spirituality', category: 'learning' },
      { id: 'volunteering', name: 'Volunteering', category: 'learning' },
      { id: 'self-improvement', name: 'Self Improvement', category: 'learning' },
      { id: 'technology', name: 'Technology', category: 'learning' },
    ]
  }
];

export const getAllInterests = (): Interest[] => {
  return interests.flatMap(category => category.interests);
};

export const getInterestsByCategory = (categoryId: string): Interest[] => {
  const category = interests.find(cat => cat.id === categoryId);
  return category ? category.interests : [];
};

export const getInterestById = (interestId: string): Interest | undefined => {
  return getAllInterests().find(interest => interest.id === interestId);
};
