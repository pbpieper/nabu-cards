-- ============================================================================
-- Nabu Cards — Seed Data
-- Run AFTER schema.sql
-- ============================================================================

-- Admin placeholder UUID
-- In production, this would match a real auth.users entry.
-- For seeding, we insert directly into profiles.
do $$
declare
  admin_id uuid := '00000000-0000-0000-0000-000000000001';
  arabic_deck_id uuid := '11111111-1111-1111-1111-111111111111';
  german_deck_id uuid := '22222222-2222-2222-2222-222222222222';
begin

-- ============================================================================
-- ADMIN PROFILE
-- ============================================================================

insert into profiles (id, email, display_name, native_language, daily_goal)
values (admin_id, 'admin@nabu.cards', 'Nabu Admin', 'en', 30)
on conflict (id) do nothing;

-- ============================================================================
-- ARABIC DECK
-- ============================================================================

insert into decks (id, owner_id, title, description, source_language, target_language, share_code, is_public, card_count)
values (
  arabic_deck_id,
  admin_id,
  'Arabic Essentials',
  'Core Arabic vocabulary covering everyday nouns, verbs, adjectives, and useful phrases. Includes romanization for pronunciation guidance.',
  'en',
  'ar',
  'ARABIC',
  true,
  30
) on conflict (id) do nothing;

-- Arabic Cards (30 total: 12 nouns, 8 verbs, 5 adjectives, 5 phrases)
-- NOUNS (12)
insert into cards (deck_id, word, translation, romanization, example_sentence, example_translation, part_of_speech, sort_order) values
(arabic_deck_id, 'كِتَاب', 'book', 'kitaab', 'هَذَا كِتَابٌ جَمِيل', 'This is a beautiful book', 'noun', 1),
(arabic_deck_id, 'بَيْت', 'house', 'bayt', 'البَيْتُ كَبِير', 'The house is big', 'noun', 2),
(arabic_deck_id, 'مَاء', 'water', 'maa''', 'أُرِيدُ مَاءً بَارِدًا', 'I want cold water', 'noun', 3),
(arabic_deck_id, 'طَعَام', 'food', 'ta''aam', 'الطَّعَامُ لَذِيذ', 'The food is delicious', 'noun', 4),
(arabic_deck_id, 'يَوْم', 'day', 'yawm', 'هَذَا يَوْمٌ جَمِيل', 'This is a beautiful day', 'noun', 5),
(arabic_deck_id, 'صَدِيق', 'friend', 'sadiiq', 'هُوَ صَدِيقِي المُفَضَّل', 'He is my best friend', 'noun', 6),
(arabic_deck_id, 'مَدْرَسَة', 'school', 'madrasa', 'المَدْرَسَةُ قَرِيبَة', 'The school is nearby', 'noun', 7),
(arabic_deck_id, 'شَمْس', 'sun', 'shams', 'الشَّمْسُ سَاطِعَة اليَوْم', 'The sun is bright today', 'noun', 8),
(arabic_deck_id, 'قَلْب', 'heart', 'qalb', 'قَلْبُهَا طَيِّب', 'Her heart is kind', 'noun', 9),
(arabic_deck_id, 'وَقْت', 'time', 'waqt', 'لَيْسَ لَدَيَّ وَقْت', 'I don''t have time', 'noun', 10),
(arabic_deck_id, 'سُوق', 'market', 'suuq', 'ذَهَبْتُ إِلَى السُّوق', 'I went to the market', 'noun', 11),
(arabic_deck_id, 'طَرِيق', 'road / way', 'tariiq', 'الطَّرِيقُ طَوِيل', 'The road is long', 'noun', 12);

-- VERBS (8)
insert into cards (deck_id, word, translation, romanization, example_sentence, example_translation, part_of_speech, sort_order) values
(arabic_deck_id, 'كَتَبَ', 'to write', 'kataba', 'كَتَبَ رِسَالَةً طَوِيلَة', 'He wrote a long letter', 'verb', 13),
(arabic_deck_id, 'قَرَأَ', 'to read', 'qara''a', 'قَرَأْتُ الكِتَابَ كُلَّهُ', 'I read the entire book', 'verb', 14),
(arabic_deck_id, 'ذَهَبَ', 'to go', 'dhahaba', 'ذَهَبَ إِلَى العَمَل', 'He went to work', 'verb', 15),
(arabic_deck_id, 'أَكَلَ', 'to eat', 'akala', 'أَكَلْنَا مَعًا', 'We ate together', 'verb', 16),
(arabic_deck_id, 'شَرِبَ', 'to drink', 'shariba', 'شَرِبْتُ الشَّاي', 'I drank the tea', 'verb', 17),
(arabic_deck_id, 'تَكَلَّمَ', 'to speak', 'takallama', 'تَكَلَّمَ بِالعَرَبِيَّة', 'He spoke in Arabic', 'verb', 18),
(arabic_deck_id, 'عَرَفَ', 'to know', '''arafa', 'أَعْرِفُ الجَوَاب', 'I know the answer', 'verb', 19),
(arabic_deck_id, 'أَحَبَّ', 'to love', 'ahabba', 'أُحِبُّ عَائِلَتِي', 'I love my family', 'verb', 20);

-- ADJECTIVES (5)
insert into cards (deck_id, word, translation, romanization, example_sentence, example_translation, part_of_speech, sort_order) values
(arabic_deck_id, 'كَبِير', 'big / large', 'kabiir', 'المَدِينَةُ كَبِيرَة جِدًّا', 'The city is very big', 'adjective', 21),
(arabic_deck_id, 'صَغِير', 'small / little', 'saghiir', 'الوَلَدُ صَغِير', 'The boy is small', 'adjective', 22),
(arabic_deck_id, 'جَمِيل', 'beautiful', 'jamiil', 'المَنْظَرُ جَمِيل', 'The view is beautiful', 'adjective', 23),
(arabic_deck_id, 'جَدِيد', 'new', 'jadiid', 'اشْتَرَيْتُ هَاتِفًا جَدِيدًا', 'I bought a new phone', 'adjective', 24),
(arabic_deck_id, 'سَهْل', 'easy', 'sahl', 'الامْتِحَانُ سَهْل', 'The exam is easy', 'adjective', 25);

-- PHRASES (5)
insert into cards (deck_id, word, translation, romanization, example_sentence, example_translation, part_of_speech, sort_order) values
(arabic_deck_id, 'السَّلَامُ عَلَيْكُم', 'peace be upon you (hello)', 'as-salaamu ''alaykum', 'السَّلَامُ عَلَيْكُم، كَيْفَ حَالُكُم؟', 'Hello, how are you?', 'phrase', 26),
(arabic_deck_id, 'شُكْرًا جَزِيلًا', 'thank you very much', 'shukran jaziilan', 'شُكْرًا جَزِيلًا عَلَى مُسَاعَدَتِك', 'Thank you very much for your help', 'phrase', 27),
(arabic_deck_id, 'مِنْ فَضْلِك', 'please', 'min fadlik', 'أَعْطِنِي المَاءَ مِنْ فَضْلِك', 'Give me the water please', 'phrase', 28),
(arabic_deck_id, 'إِنْ شَاءَ اللَّه', 'God willing', 'in shaa'' allaah', 'سَأَزُورُكَ غَدًا إِنْ شَاءَ اللَّه', 'I will visit you tomorrow, God willing', 'phrase', 29),
(arabic_deck_id, 'مَعَ السَّلَامَة', 'goodbye', 'ma''a as-salaama', 'مَعَ السَّلَامَة، إِلَى اللِّقَاء', 'Goodbye, until we meet again', 'phrase', 30);

-- ============================================================================
-- GERMAN DECK
-- ============================================================================

insert into decks (id, owner_id, title, description, source_language, target_language, share_code, is_public, card_count)
values (
  german_deck_id,
  admin_id,
  'German Basics',
  'Essential German vocabulary for beginners. Covers common nouns with articles, verbs, adjectives, and everyday phrases.',
  'en',
  'de',
  'GERMAN',
  true,
  25
) on conflict (id) do nothing;

-- German Cards (25 total: 10 nouns, 6 verbs, 4 adjectives, 5 phrases)
-- NOUNS (10)
insert into cards (deck_id, word, translation, example_sentence, example_translation, part_of_speech, sort_order) values
(german_deck_id, 'der Hund', 'the dog', 'Der Hund spielt im Garten.', 'The dog is playing in the garden.', 'noun', 1),
(german_deck_id, 'die Katze', 'the cat', 'Die Katze schläft auf dem Sofa.', 'The cat is sleeping on the sofa.', 'noun', 2),
(german_deck_id, 'das Haus', 'the house', 'Das Haus ist sehr alt.', 'The house is very old.', 'noun', 3),
(german_deck_id, 'der Baum', 'the tree', 'Der Baum ist sehr groß.', 'The tree is very tall.', 'noun', 4),
(german_deck_id, 'die Straße', 'the street', 'Die Straße ist heute leer.', 'The street is empty today.', 'noun', 5),
(german_deck_id, 'das Wasser', 'the water', 'Kann ich ein Glas Wasser haben?', 'Can I have a glass of water?', 'noun', 6),
(german_deck_id, 'der Freund', 'the friend (male)', 'Er ist mein bester Freund.', 'He is my best friend.', 'noun', 7),
(german_deck_id, 'die Freundin', 'the friend (female)', 'Sie ist meine beste Freundin.', 'She is my best friend.', 'noun', 8),
(german_deck_id, 'das Buch', 'the book', 'Ich lese ein interessantes Buch.', 'I am reading an interesting book.', 'noun', 9),
(german_deck_id, 'die Zeit', 'the time', 'Ich habe keine Zeit.', 'I have no time.', 'noun', 10);

-- VERBS (6)
insert into cards (deck_id, word, translation, example_sentence, example_translation, part_of_speech, sort_order) values
(german_deck_id, 'sprechen', 'to speak', 'Ich spreche ein bisschen Deutsch.', 'I speak a little German.', 'verb', 11),
(german_deck_id, 'essen', 'to eat', 'Wir essen zusammen zu Abend.', 'We are eating dinner together.', 'verb', 12),
(german_deck_id, 'trinken', 'to drink', 'Was möchtest du trinken?', 'What would you like to drink?', 'verb', 13),
(german_deck_id, 'gehen', 'to go / to walk', 'Ich gehe jeden Tag zur Arbeit.', 'I walk to work every day.', 'verb', 14),
(german_deck_id, 'lernen', 'to learn / to study', 'Ich lerne Deutsch seit einem Jahr.', 'I have been learning German for a year.', 'verb', 15),
(german_deck_id, 'wissen', 'to know (a fact)', 'Ich weiß es nicht.', 'I don''t know.', 'verb', 16);

-- ADJECTIVES (4)
insert into cards (deck_id, word, translation, example_sentence, example_translation, part_of_speech, sort_order) values
(german_deck_id, 'schön', 'beautiful / nice', 'Das Wetter ist heute schön.', 'The weather is nice today.', 'adjective', 17),
(german_deck_id, 'groß', 'big / tall', 'Berlin ist eine große Stadt.', 'Berlin is a big city.', 'adjective', 18),
(german_deck_id, 'klein', 'small / little', 'Das Kind ist noch sehr klein.', 'The child is still very small.', 'adjective', 19),
(german_deck_id, 'schnell', 'fast / quick', 'Der Zug ist sehr schnell.', 'The train is very fast.', 'adjective', 20);

-- PHRASES (5)
insert into cards (deck_id, word, translation, example_sentence, example_translation, part_of_speech, sort_order) values
(german_deck_id, 'Guten Morgen', 'Good morning', 'Guten Morgen! Wie geht es Ihnen?', 'Good morning! How are you?', 'phrase', 21),
(german_deck_id, 'Wie geht es dir?', 'How are you? (informal)', 'Hallo! Wie geht es dir heute?', 'Hello! How are you today?', 'phrase', 22),
(german_deck_id, 'Entschuldigung', 'Excuse me / Sorry', 'Entschuldigung, wo ist der Bahnhof?', 'Excuse me, where is the train station?', 'phrase', 23),
(german_deck_id, 'Ich verstehe nicht', 'I don''t understand', 'Tut mir leid, ich verstehe nicht.', 'I''m sorry, I don''t understand.', 'phrase', 24),
(german_deck_id, 'Auf Wiedersehen', 'Goodbye (formal)', 'Auf Wiedersehen und bis bald!', 'Goodbye and see you soon!', 'phrase', 25);

end;
$$;
