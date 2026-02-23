-- ============================================================================
-- INFORMATION SYSTEM DATABASE SCHEMA
-- ============================================================================
-- This script creates tables for the contextual information system
-- that provides educational content and help throughout the application
-- ============================================================================

-- ============================================================================
-- INFORMATION CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.info_categories (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name text NOT NULL UNIQUE,
    description text,
    icon text, -- Lucide icon name
    color text DEFAULT 'blue', -- Tailwind color class
    sort_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- INFORMATION TOPICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.info_topics (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    category_id uuid,
    title text NOT NULL,
    slug text NOT NULL UNIQUE,
    description text,
    content text NOT NULL, -- Rich text content (Markdown/HTML)
    summary text, -- Brief summary for quick view
    tags text[], -- Array of tags for search
    difficulty_level text DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    reading_time_minutes integer DEFAULT 5,
    image_url text,
    video_url text,
    external_links jsonb DEFAULT '[]'::jsonb, -- Array of {title, url} objects
    related_topics uuid[], -- Array of related topic IDs
    view_count integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TOPIC CONTEXTS (Where topics should appear)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.info_topic_contexts (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id uuid NOT NULL,
    page_path text NOT NULL, -- e.g., '/livestock', '/crops'
    component_name text, -- e.g., 'LivestockList', 'CropOverview'
    context_key text NOT NULL, -- e.g., 'goat_breeds', 'vaccines', 'grass_types'
    context_label text NOT NULL, -- User-friendly label for the info button
    trigger_type text DEFAULT 'icon' CHECK (trigger_type IN ('icon', 'link', 'auto')),
    position jsonb DEFAULT '{"x": "right", "y": "top"}'::jsonb, -- Position relative to element
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TOPIC VIEWS (Analytics)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.info_topic_views (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id uuid NOT NULL,
    user_id uuid,
    page_path text,
    context_key text,
    viewed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    session_id text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- TOPIC FEEDBACK
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.info_topic_feedback (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    topic_id uuid NOT NULL,
    user_id uuid,
    rating integer CHECK (rating >= 1 AND rating <= 5),
    helpful boolean,
    comment text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- ============================================================================
-- SAMPLE DATA - CATEGORIES
-- ============================================================================
-- Insert sample information categories
INSERT INTO info_categories (id, name, slug, description, icon, sort_order, is_active) VALUES
('livestock-breeds', 'Livestock Breeds', 'livestock-breeds', 'Information about livestock breeds and their characteristics', 'cow', 1, true),
('livestock-health', 'Livestock Health', 'livestock-health', 'Health management, diseases, and treatments for livestock', 'heart', 2, true),
('livestock-nutrition', 'Livestock Nutrition', 'livestock-nutrition', 'Feeding, nutrition, and pasture management', 'apple-alt', 3, true),
('crop-varieties', 'Crop Varieties', 'crop-varieties', 'Information about crop varieties and cultivars', 'seedling', 4, true),
('crop-health', 'Crop Health', 'crop-health', 'Pest management, diseases, and crop protection', 'shield-alt', 5, true),
('crop-management', 'Crop Management', 'crop-management', 'Planting, harvesting, and crop management practices', 'tasks', 6, true),
('soil-health', 'Soil Health', 'soil-health', 'Soil testing, fertility, and conservation', 'layer-group', 7, true),
('irrigation', 'Irrigation', 'irrigation', 'Water management and irrigation systems', 'tint', 8, true),
('zimbabwe-agriculture', 'Zimbabwe Agriculture', 'zimbabwe-agriculture', 'Zimbabwe-specific agricultural information and practices', 'map-marked-alt', 9, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - LIVESTOCK TOPICS
-- ============================================================================

-- Zimbabwe Indigenous Cattle Breeds
INSERT INTO public.info_topics (
    category_id, title, slug, description, content, summary, tags, difficulty_level, reading_time_minutes, is_featured
) VALUES
(
    (SELECT id FROM public.info_categories WHERE name = 'Livestock Breeds'),
    'Zimbabwe Indigenous Cattle Breeds',
    'zimbabwe-indigenous-cattle-breeds',
    'Comprehensive guide to Zimbabwe''s indigenous cattle breeds: Mashona, Nkone, and Tuli',
    '# Zimbabwe Indigenous Cattle Breeds

Zimbabwe is home to three indigenous Sanga cattle breeds that have evolved over centuries to thrive in local conditions.

## Mashona Cattle
- **Origin**: Indigenous to Zimbabwe, descended from original Sanga stock
- **Characteristics**: Small to medium frame, docile temperament, excellent fertility
- **Performance**: Superior weaning rates (31.0 kg) compared to other breeds
- **Adaptation**: Heat tolerant, disease resistant, excellent foragers
- **Uses**: Dual-purpose (meat and milk), ideal for smallholder farming

## Nkone Cattle
- **Origin**: Brought by King Mzilikazi in 1836 from Zululand
- **Characteristics**: Distinctive color patterns, muscular build, hardy
- **Performance**: Lowest cost-per-kg production, excellent beef quality
- **Adaptation**: Thrives in harsh conditions, drought tolerant
- **Uses**: Primarily beef production, crossbreeding potential

## Tuli Cattle
- **Origin**: Developed at Tuli Breeding Station from indigenous stock
- **Characteristics**: Medium frame, good temperament, efficient converters
- **Performance**: Good growth rates, excellent carcass quality
- **Adaptation**: Well-adapted to Zimbabwean conditions
- **Uses**: Beef production, crossbreeding with exotic breeds

## Management Recommendations
- Choose breed based on your farming system and market requirements
- Mashona: Best for smallholder, resource-limited farming
- Nkone: Ideal for commercial beef production
- Tuli: Good balance of performance and adaptability
- Consider crossbreeding to combine desirable traits',
    'Complete guide to Zimbabwe''s indigenous cattle breeds including Mashona, Nkone, and Tuli with characteristics, performance, and management recommendations.',
    '{"zimbabwe", "cattle", "mashona", "nkone", "tuli", "indigenous", "sanga", "livestock"}',
    'beginner',
    12,
    true
);
    -- Zimbabwe Traditional Small Grains
INSERT INTO public.info_topics (
    category_id, title, slug, description, content, summary, tags, difficulty_level, reading_time_minutes, is_featured
) VALUES
(
    (SELECT id FROM public.info_categories WHERE name = 'Crop Varieties'),
    'Zimbabwe Traditional Small Grains',
    'zimbabwe-traditional-small-grains',
    'Comprehensive guide to traditional small grains in Zimbabwe: sorghum, millet, rapoko, and others',
    '# Zimbabwe Traditional Small Grains

Traditional small grains are gaining renewed importance in Zimbabwe due to their drought tolerance and nutritional value.

## Sorghum (Mapfunde)
- **Adaptation**: Excellent drought tolerance, suitable for Regions 4-5
- **Varieties**: SV1, SV2, SV4 (improved varieties)
- **Yield**: 1.5-3.0 tons/ha under good management
- **Uses**: Sadza, traditional beer, animal feed
- **Planting**: November-December, after first rains
- **Advantages**: Less fertilizer requirement than maize

## Pearl Millet (Mhunga)
- **Adaptation**: Most drought-tolerant cereal crop
- **Varieties**: PMV1, PMV2, PMV3 (improved varieties)
- **Yield**: 1.0-2.5 tons/ha
- **Uses**: Sadza, porridge, traditional foods
- **Planting**: Early November to mid-December
- **Advantages**: Excellent for marginal areas

## Finger Millet (Rapoko/Rukweza)
- **Adaptation**: Well-suited to high-altitude areas
- **Varieties**: Local landraces and improved varieties
- **Yield**: 1.2-2.0 tons/ha
- **Uses**: Traditional beer, porridge, ceremonial foods
- **Cultural Importance**: Essential for traditional ceremonies
- **Market**: Growing demand for traditional foods

## Barnyard Millet (Svoboda)
- **Adaptation**: Early maturing, drought tolerant
- **Yield**: 1.0-1.8 tons/ha
- **Uses**: Porridge, traditional foods
- **Advantages**: Short growing season (90-100 days)

## Management Practices
- **Land Preparation**: Fine seedbed essential for small seeds
- **Planting**: Broadcast or row planting, shallow depth
- **Fertilizer**: Low requirements, basal application recommended
- **Weed Control**: Critical during early growth stages
- **Harvesting**: Manual cutting, threshing and winnowing

## Market Opportunities
- Growing demand for healthy, traditional foods
- Premium prices for organic small grains
- Government support through GMB purchases
- Export potential to regional markets',
    'Complete guide to Zimbabwe traditional small grains including sorghum, millet, rapoko, and their management practices.',
    '{"zimbabwe", "small-grains", "sorghum", "millet", "rapoko", "drought-tolerant", "traditional-crops"}',
    'intermediate',
    15,
    true
),

-- Zimbabwe Maize Varieties
INSERT INTO public.info_topics (
    category_id, title, slug, description, content, summary, tags, difficulty_level, reading_time_minutes, is_featured
) VALUES
(
    (SELECT id FROM public.info_categories WHERE name = 'Crop Varieties'),
    'Zimbabwe Maize Varieties',
    'zimbabwe-maize-varieties',
    'Recommended maize varieties for different agro-ecological regions in Zimbabwe',
    '# Zimbabwe Maize Varieties

Maize remains Zimbabwe''s staple crop, with varieties suited to different growing conditions.

## Early Maturing Varieties (Regions 4-5)
### SC 403
- **Maturity**: 120-125 days
- **Yield**: 8-10 tons/ha under good management
- **Characteristics**: White kernels, drought tolerant
- **Best For**: Regions 4-5, late planting

### SC 513
- **Maturity**: 140-145 days
- **Yield**: 10-12 tons/ha
- **Characteristics**: Large cobs, disease resistant
- **Best For**: Regions 3-4, good rainfall areas

## Medium Maturing Varieties (Regions 2-3)
### PAN 53
- **Maturity**: 130-135 days
- **Yield**: 9-11 tons/ha
- **Characteristics**: Yellow kernels, high protein content
- **Best For**: Regions 2-3, animal feed production

### ZM 521
- **Maturity**: 125-130 days
- **Yield**: 8.5-10.5 tons/ha
- **Characteristics**: Early maturing, stress tolerant
- **Best For**: Early season planting, Regions 3-4

## Late Maturing Varieties (Regions 1-2)
### SC 727
- **Maturity**: 150-155 days
- **Yield**: 12-15 tons/ha
- **Characteristics**: Very high yield potential
- **Best For**: High rainfall areas, Regions 1-2

## Seed Maize Varieties
### SC 637
- **Maturity**: 145-150 days
- **Yield**: 10-12 tons/ha
- **Characteristics**: Certified seed quality
- **Best For**: Seed production, Regions 1-3

## Regional Recommendations
- **Region 1**: SC 727, SC 637 (high altitude, high rainfall)
- **Region 2**: PAN 53, SC 513 (good rainfall)
- **Region 3**: SC 513, ZM 521 (moderate rainfall)
- **Region 4**: SC 403, ZM 521 (low rainfall)
- **Region 5**: SC 403, early maturing varieties (semi-arid)

## Planting Guidelines
- **Planting Time**: November 15 - December 15
- **Seed Rate**: 25-30 kg/ha
- **Spacing**: 75cm between rows, 25cm within rows
- **Fertilizer**: Basal + top dressing based on soil tests',
    'Comprehensive guide to Zimbabwe maize varieties with regional recommendations and planting guidelines.',
    '{"zimbabwe", "maize", "varieties", "seed-maize", "agro-ecological-regions", "planting-guide"}',
    'intermediate',
    12,
    true
);
(
    (SELECT id FROM public.info_categories WHERE name = 'Livestock Health'),
    'Goat Vaccination Schedule',
    'goat-vaccination-schedule',
    'Essential vaccination schedule and protocols for goat health',
    '# Goat Vaccination Schedule

## Core Vaccinations

### CD&T (Clostridial Diseases)
- **When**: Annual booster
- **Age**: First dose at 6-8 weeks
- **Purpose**: Prevents enterotoxemia and tetanus
- **Dosage**: 2ml subcutaneously

### Rabies
- **When**: Annual
- **Age**: First dose at 12 weeks
- **Purpose**: Prevents rabies
- **Dosage**: As per manufacturer

## Optional Vaccinations

### Pneumonia
- **When**: Biannual for high-risk areas
- **Purpose**: Prevents respiratory infections
- **Timing**: Before stress periods (weaning, transport)

### Caseous Lymphadenitis (CLA)
- **When**: Annual
- **Purpose**: Prevents abscesses
- **Method**: Subcutaneous injection

## Vaccination Tips

1. **Store vaccines** at recommended temperatures
2. **Use sterile equipment** for each goat
3. **Record all vaccinations** in health records
4. **Watch for reactions** after vaccination
5. **Consult veterinarian** for customized schedules',
    'Essential vaccination schedule for goats including core and optional vaccines with timing and dosage information.',
    ARRAY['goats', 'vaccines', 'health', 'prevention', 'livestock'],
    'intermediate',
    6,
    true
),
(
    (SELECT id FROM public.info_categories WHERE name = 'Livestock Nutrition'),
    'Goat Feed Types and Nutrition',
    'goat-feed-nutrition',
    'Complete guide to goat nutrition including pasture, supplements, and feeding strategies',
    '# Goat Nutrition Guide

## Pasture Management

### Excellent Forage Grasses
- **Bermuda Grass**: High protein, drought-resistant
- **Alfalfa**: Excellent protein source, good for dairy goats
- **Clover**: Nitrogen-fixing, highly palatable
- **Ryegrass**: Fast-growing, good for rotational grazing

### Forage Quality
- **Protein Content**: 12-18% for optimal growth
- **Digestibility**: 65-70% for good utilization
- **Mineral Balance**: Calcium:Phosphorus ratio of 2:1

## Supplemental Feeds

### Concentrates
- **Grain Mix**: 14-16% protein for growing goats
- **Corn**: Energy source, limit to 20% of diet
- **Barley**: Good energy source, less heating than corn
- **Oats**: Safe choice, high fiber content

### Minerals and Supplements
- **Salt Block**: Free choice, essential minerals
- **Selenium Supplement**: Important in selenium-deficient areas
- **Copper Bolus**: Every 6 months for adult goats
- **Probiotics**: During stress or antibiotic treatment

## Feeding Strategies

### Age-Specific Requirements
- **Kids (0-3 months)**: 18-20% protein, milk replacer
- **Growers (3-12 months)**: 16-18% protein, balanced ration
- **Adults**: 12-14% protein, maintenance ration
- **Pregnant/Lactating**: 14-16% protein, increased energy

### Seasonal Adjustments
- **Winter**: Increase energy by 20-30%
- **Summer**: Focus on quality forage, provide shade
- **Rainy Season**: Monitor for moldy feed',
    'Comprehensive guide to goat nutrition including pasture management, supplemental feeds, and feeding strategies by age and season.',
    ARRAY['goats', 'nutrition', 'feed', 'pasture', 'supplements'],
    'intermediate',
    10,
    true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - CROP TOPICS
-- ============================================================================

INSERT INTO public.info_topics (
    category_id, title, slug, description, content, summary, tags, difficulty_level, reading_time_minutes, is_featured
) VALUES
(
    (SELECT id FROM public.info_categories WHERE name = 'Crop Varieties'),
    'Maize Varieties Guide',
    'maize-varieties-guide',
    'Complete guide to maize varieties suitable for different climates and purposes',
    '# Maize Varieties Guide

## White Maize Varieties

### SC 403
- **Maturity**: 120-125 days
- **Yield**: 8-10 tons/ha
- **Characteristics**: White kernels, drought tolerant
- **Best For**: General purpose, mealie meal production

### SC 513
- **Maturity**: 140-145 days
- **Yield**: 10-12 tons/ha
- **Characteristics**: Large cobs, disease resistant
- **Best For**: Commercial production

## Yellow Maize Varieties

### PAN 53
- **Maturity**: 130-135 days
- **Yield**: 9-11 tons/ha
- **Characteristics**: Yellow kernels, high protein
- **Best For**: Animal feed, industrial use

### ZM 521
- **Maturity**: 125-130 days
- **Yield**: 8.5-10.5 tons/ha
- **Characteristics**: Early maturing, stress tolerant
- **Best For**: Early season planting

## Sweet Corn Varieties

### Golden Bantam
- **Maturity**: 80-85 days
- **Yield**: 6-8 tons/ha
- **Characteristics**: Sweet, yellow kernels
- **Best For**: Fresh market, home consumption

### Silver Queen
- **Maturity**: 85-90 days
- **Yield**: 7-9 tons/ha
- **Characteristics**: Extra sweet, white kernels
- **Best For**: Premium fresh market',
    'Complete guide to maize varieties including white, yellow, and sweet corn with maturity periods and yield information.',
    ARRAY['maize', 'corn', 'varieties', 'crops', 'cereals'],
    'beginner',
    7,
    true
),
(
    (SELECT id FROM public.info_categories WHERE name = 'Crop Health'),
    'Common Maize Pests and Diseases',
    'maize-pests-diseases',
    'Identification and management of common maize pests and diseases',
    '# Maize Pests and Diseases Management

## Major Pests

### Fall Armyworm (Spodoptera frugiperda)
- **Identification**: Dark stripes on back, Y-shaped mark on head
- **Damage**: Eats leaves, bores into cobs
- **Control**: 
  - Early detection and manual removal
  - Biological control (parasitoids)
  - Chemical control when damage > 20%

### Stem Borer (Busseola fusca)
- **Identification**: White larvae, tunnels in stems
- **Damage**: Weakens stems, reduces yield
- **Control**:
  - Crop rotation
  - Early planting
  - Resistant varieties

## Common Diseases

### Maize Streak Virus
- **Symptoms**: Yellow streaks on leaves, stunted growth
- **Spread**: Leafhopper insects
- **Management**:
  - Resistant varieties
  - Vector control
  - Remove infected plants

### Gray Leaf Spot
- **Symptoms**: Gray rectangular spots on leaves
- **Favorable Conditions**: High humidity, moderate temperatures
- **Management**:
  - Crop rotation
  - Fungicide application
  - Proper spacing for air circulation

## Integrated Pest Management

### Prevention
1. **Use certified seeds**
2. **Practice crop rotation**
3. **Maintain proper plant density**
4. **Monitor fields regularly**

### Economic Thresholds
- **Fall Armyworm**: Treat when 20% plants show damage
- **Stem Borer**: Treat when 10% plants show tunnelling
- **Diseases**: Treat when severity affects yield potential',
    'Comprehensive guide to identifying and managing common maize pests and diseases with integrated pest management strategies.',
    ARRAY['maize', 'pests', 'diseases', 'IPM', 'crop-protection'],
    'intermediate',
    9,
    true
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SAMPLE DATA - TOPIC CONTEXTS
-- ============================================================================

INSERT INTO public.info_topic_contexts (topic_id, page_path, component_name, context_key, context_label, trigger_type, position) VALUES
-- Livestock page contexts
(
    (SELECT id FROM public.info_topics WHERE slug = 'goat-breeds-guide'),
    '/livestock',
    'LivestockList',
    'goat_breeds_info',
    'Goat Breeds Information',
    'icon',
    '{"x": "right", "y": "top"}'
),
(
    (SELECT id FROM public.info_topics WHERE slug = 'goat-vaccination-schedule'),
    '/livestock',
    'HealthReference',
    'vaccination_info',
    'Vaccination Schedule',
    'icon',
    '{"x": "right", "y": "top"}'
),
(
    (SELECT id FROM public.info_topics WHERE slug = 'goat-feed-nutrition'),
    '/livestock',
    'FeedManagement',
    'nutrition_info',
    'Goat Nutrition Guide',
    'icon',
    '{"x": "right", "y": "top"}'
),
-- Crops page contexts
(
    (SELECT id FROM public.info_topics WHERE slug = 'maize-varieties-guide'),
    '/crops',
    'CropsOverview',
    'maize_varieties_info',
    'Maize Varieties',
    'icon',
    '{"x": "right", "y": "top"}'
),
(
    (SELECT id FROM public.info_topics WHERE slug = 'maize-pests-diseases'),
    '/crops',
    'PestDiseaseManager',
    'pest_disease_info',
    'Pest & Disease Management',
    'icon',
    '{"x": "right", "y": "top"}'
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_info_topics_category_id ON public.info_topics(category_id);
CREATE INDEX IF NOT EXISTS idx_info_topics_slug ON public.info_topics(slug);
CREATE INDEX IF NOT EXISTS idx_info_topics_tags ON public.info_topics USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_info_topics_is_active ON public.info_topics(is_active);
CREATE INDEX IF NOT EXISTS idx_info_topic_contexts_topic_id ON public.info_topic_contexts(topic_id);
CREATE INDEX IF NOT EXISTS idx_info_topic_contexts_page_path ON public.info_topic_contexts(page_path);
CREATE INDEX IF NOT EXISTS idx_info_topic_contexts_context_key ON public.info_topic_contexts(context_key);
CREATE INDEX IF NOT EXISTS idx_info_topic_views_topic_id ON public.info_topic_views(topic_id);
CREATE INDEX IF NOT EXISTS idx_info_topic_views_user_id ON public.info_topic_views(user_id);
CREATE INDEX IF NOT EXISTS idx_info_topic_feedback_topic_id ON public.info_topic_feedback(topic_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.info_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_topic_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_topic_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_topic_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for public read access
CREATE POLICY "Public read access for info_categories" ON public.info_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for info_topics" ON public.info_topics
    FOR SELECT USING (is_active = true);

CREATE POLICY "Public read access for info_topic_contexts" ON public.info_topic_contexts
    FOR SELECT USING (is_active = true);

-- Policies for user-specific data
CREATE POLICY "Users can view their own topic views" ON public.info_topic_views
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own topic views" ON public.info_topic_views
    FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can view their own feedback" ON public.info_topic_feedback
    FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY "Users can insert their own feedback" ON public.info_topic_feedback
    FOR INSERT WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- Admin policies for content management
CREATE POLICY "Admins can manage all content" ON public.info_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all topics" ON public.info_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can manage all contexts" ON public.info_topic_contexts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
