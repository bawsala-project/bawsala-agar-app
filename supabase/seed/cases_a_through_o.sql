-- ============================================================================
-- Bawsalat Al-Aqar - Canonical Seed Fixtures: Cases A through O
-- Section 25: Canonical Real-World Scenario Test Matrix
-- ============================================================================

-- 0. Ensure Canonical Test User Exists
INSERT INTO auth.users (id, aud, role, email)
VALUES (
  'a0000000-0000-4000-8000-000000000001',
  'authenticated',
  'authenticated',
  'canonical_seed@bawsala.local'
)
ON CONFLICT (id) DO NOTHING;

-- Clean prior seed case rows to ensure deterministic idempotency
DELETE FROM public.decision_cases WHERE id IN (
  'ca000000-0000-4000-8000-000000000001', -- Case A
  'ca000000-0000-4000-8000-000000000002', -- Case B
  'ca000000-0000-4000-8000-000000000003', -- Case C
  'ca000000-0000-4000-8000-000000000004', -- Case D
  'ca000000-0000-4000-8000-000000000005', -- Case E
  'ca000000-0000-4000-8000-000000000006', -- Case F
  'ca000000-0000-4000-8000-000000000007', -- Case G
  'ca000000-0000-4000-8000-000000000008', -- Case H
  'ca000000-0000-4000-8000-000000000009', -- Case I
  'ca000000-0000-4000-8000-00000000000a', -- Case J
  'ca000000-0000-4000-8000-00000000000b', -- Case K
  'ca000000-0000-4000-8000-00000000000c', -- Case L
  'ca000000-0000-4000-8000-00000000000d', -- Case M
  'ca000000-0000-4000-8000-00000000000e', -- Case N
  'ca000000-0000-4000-8000-00000000000f'  -- Case O
);

-- ============================================================================
-- CASE A: Riyadh (النرجس)
-- 3 complete properties with clear ranking (Winner has verified elevator, low price, matching area)
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'الرياض', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms, min_area_sqm, hard_constraints, preferences)
VALUES (
  'ca000000-0000-4000-8000-000000000001',
  1000000.00,
  'cash',
  4,
  3,
  130.00,
  '[{"key": "elevator_required"}, {"key": "max_floor", "value": 3}]'::jsonb,
  '[]'::jsonb
);

-- Property A1 (Winner: price 850k, 145m², 3 bed, floor 2, elevator verified)
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000011', 'ca000000-0000-4000-8000-000000000001', 'manual', 'شقة النرجس الفاخرة - الفائز', 'النرجس', 850000.00, 145.00, 3, 2);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000011', 'ba000000-0000-4000-8000-000000000011', 'listing_price_sar', '850000'::jsonb, '850,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000012', 'ba000000-0000-4000-8000-000000000011', 'area_sqm', '145'::jsonb, '145 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000013', 'ba000000-0000-4000-8000-000000000011', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000014', 'ba000000-0000-4000-8000-000000000011', 'floor_no', '2'::jsonb, 'الدور الثاني', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000015', 'ba000000-0000-4000-8000-000000000011', 'elevator', 'true'::jsonb, 'يوجد مصعد', 'building', 'manual', true);

-- Property A2 (Runner up: price 970k, 135m², 3 bed, floor 3, elevator verified)
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000012', 'ca000000-0000-4000-8000-000000000001', 'manual', 'شقة النرجس بريميوم - المركز الثاني', 'النرجس', 970000.00, 135.00, 3, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000021', 'ba000000-0000-4000-8000-000000000012', 'listing_price_sar', '970000'::jsonb, '970,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000022', 'ba000000-0000-4000-8000-000000000012', 'area_sqm', '135'::jsonb, '135 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000023', 'ba000000-0000-4000-8000-000000000012', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000024', 'ba000000-0000-4000-8000-000000000012', 'floor_no', '3'::jsonb, 'الدور الثالث', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000025', 'ba000000-0000-4000-8000-000000000012', 'elevator', 'true'::jsonb, 'يوجد مصعد', 'building', 'manual', true);

-- Property A3 (Violates elevator: price 820k, 140m², 3 bed, floor 3, elevator false)
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000013', 'ca000000-0000-4000-8000-000000000001', 'manual', 'شقة النرجس الاقتصادية بدون مصعد', 'النرجس', 820000.00, 140.00, 3, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000031', 'ba000000-0000-4000-8000-000000000013', 'listing_price_sar', '820000'::jsonb, '820,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000032', 'ba000000-0000-4000-8000-000000000013', 'area_sqm', '140'::jsonb, '140 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000033', 'ba000000-0000-4000-8000-000000000013', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000034', 'ba000000-0000-4000-8000-000000000013', 'floor_no', '3'::jsonb, 'الدور الثالث', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000035', 'ba000000-0000-4000-8000-000000000013', 'elevator', 'false'::jsonb, 'لا يوجد مصعد', 'building', 'manual', true);

-- ============================================================================
-- CASE B: Jeddah (أبحر الشمالية)
-- Cheap property violating budget/location constraint (ranked low despite low price)
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'جدة', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms, min_area_sqm, hard_constraints, important_locations)
VALUES (
  'ca000000-0000-4000-8000-000000000002',
  750000.00,
  'finance',
  3,
  2,
  100.00,
  '[{"key": "max_floor", "value": 2}, {"key": "elevator_required"}]'::jsonb,
  '[{"label": "مقر العمل", "district": "أبحر الشمالية"}]'::jsonb
);

-- Property B1 (Cheap 480k, but floor 4 and no elevator)
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000021', 'ca000000-0000-4000-8000-000000000002', 'manual', 'شقة رخيصة الدور الرابع بدون مصعد', 'أبحر الشمالية', 480000.00, 110.00, 2, 4);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000041', 'ba000000-0000-4000-8000-000000000021', 'listing_price_sar', '480000'::jsonb, '480,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000042', 'ba000000-0000-4000-8000-000000000021', 'area_sqm', '110'::jsonb, '110 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000043', 'ba000000-0000-4000-8000-000000000021', 'bedrooms', '2'::jsonb, '2 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000044', 'ba000000-0000-4000-8000-000000000021', 'floor_no', '4'::jsonb, 'الدور الرابع', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000045', 'ba000000-0000-4000-8000-000000000021', 'elevator', 'false'::jsonb, 'لا يوجد مصعد', 'building', 'manual', true);

-- Property B2 (Compliant 720k, floor 1, elevator true)
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000022', 'ca000000-0000-4000-8000-000000000002', 'manual', 'شقة أبحر الدور الأول بمصعد', 'أبحر الشمالية', 720000.00, 120.00, 2, 1);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000051', 'ba000000-0000-4000-8000-000000000022', 'listing_price_sar', '720000'::jsonb, '720,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000052', 'ba000000-0000-4000-8000-000000000022', 'area_sqm', '120'::jsonb, '120 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000053', 'ba000000-0000-4000-8000-000000000022', 'bedrooms', '2'::jsonb, '2 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000054', 'ba000000-0000-4000-8000-000000000022', 'floor_no', '1'::jsonb, 'الدور الأول', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000055', 'ba000000-0000-4000-8000-000000000022', 'elevator', 'true'::jsonb, 'يوجد مصعد', 'building', 'manual', true);

-- ============================================================================
-- CASE C: Riyadh (الملقا)
-- Conflicting area between URL (140 m²) and flyer image (125 m²) generating a preflight blocker
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'الرياض', 'draft', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms, min_area_sqm)
VALUES ('ca000000-0000-4000-8000-000000000003', 900000.00, 'cash', 4, 3, 130.00);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-000000000031', 'ca000000-0000-4000-8000-000000000003', 'url', 'شقة الملقا - تعارض مساحة', 'الملقا', 880000.00, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_text, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000061', 'ba000000-0000-4000-8000-000000000031', 'area_sqm', '140'::jsonb, '140 م²', 'unit', 'url', 'المساحة 140 متر مربع', true),
  ('fa000000-0000-4000-8000-000000000062', 'ba000000-0000-4000-8000-000000000031', 'area_sqm', '125'::jsonb, '125 م²', 'unit', 'image', 'مخطط البروشور 125م', true),
  ('fa000000-0000-4000-8000-000000000063', 'ba000000-0000-4000-8000-000000000031', 'listing_price_sar', '880000'::jsonb, '880,000 ريال', 'unit', 'manual', null, true),
  ('fa000000-0000-4000-8000-000000000064', 'ba000000-0000-4000-8000-000000000031', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', null, true);

-- ============================================================================
-- CASE D: Khobar (الراكة)
-- Insufficient comparables for market price, resulting in insufficient_evidence fair price state
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'الخبر', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms, min_area_sqm)
VALUES ('ca000000-0000-4000-8000-000000000004', 1200000.00, 'cash', 4, 3, 150.00);

-- Property with missing area (area is null)
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-000000000041', 'ca000000-0000-4000-8000-000000000004', 'manual', 'فيلا روف الراكة - مساحة مجهولة', 'الراكة', 1150000.00, 4);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000071', 'ba000000-0000-4000-8000-000000000041', 'listing_price_sar', '1150000'::jsonb, '1,150,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000072', 'ba000000-0000-4000-8000-000000000041', 'bedrooms', '4'::jsonb, '4 غرف', 'unit', 'manual', true);

-- ============================================================================
-- CASE E: Dammam (الشاطئ)
-- On-site inspection finding (elevator problem recorded) flipping Property 1 to rank 2
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000005', 'a0000000-0000-4000-8000-000000000001', 'الدمام', 'analyzed', 2);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms, hard_constraints)
VALUES (
  'ca000000-0000-4000-8000-000000000005',
  950000.00,
  'cash',
  4,
  3,
  '[{"key": "elevator_required"}]'::jsonb
);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES
  ('ba000000-0000-4000-8000-000000000051', 'ca000000-0000-4000-8000-000000000005', 'manual', 'شقة الشاطئ الأولى - مصعد قيد الفحص', 'الشاطئ', 850000.00, 130.00, 3, 3),
  ('ba000000-0000-4000-8000-000000000052', 'ca000000-0000-4000-8000-000000000005', 'manual', 'شقة الشاطئ الثانية - مصعد ممتاز', 'الشاطئ', 920000.00, 135.00, 3, 2);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000081', 'ba000000-0000-4000-8000-000000000051', 'listing_price_sar', '850000'::jsonb, '850,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000082', 'ba000000-0000-4000-8000-000000000051', 'area_sqm', '130'::jsonb, '130 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000083', 'ba000000-0000-4000-8000-000000000051', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000084', 'ba000000-0000-4000-8000-000000000051', 'floor_no', '3'::jsonb, 'الدور الثالث', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000085', 'ba000000-0000-4000-8000-000000000052', 'listing_price_sar', '920000'::jsonb, '920,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000086', 'ba000000-0000-4000-8000-000000000052', 'area_sqm', '135'::jsonb, '135 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000087', 'ba000000-0000-4000-8000-000000000052', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000088', 'ba000000-0000-4000-8000-000000000052', 'floor_no', '2'::jsonb, 'الدور الثاني', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000089', 'ba000000-0000-4000-8000-000000000052', 'elevator', 'true'::jsonb, 'يوجد مصعد', 'building', 'manual', true);

INSERT INTO public.analysis_runs (id, case_id, base_state_version, status, model, prompt_version, analysis_runtime_version)
VALUES ('da000000-0000-4000-8000-000000000001', 'ca000000-0000-4000-8000-000000000005', 2, 'committed', 'gemini-flash-lite', 'v1', 'week4.v1');

INSERT INTO public.property_assessments (id, run_id, property_id, constraint_results, price_per_sqm, fit_rating, fit_summary, strengths, risks, key_unknowns, visit_priority, visit_priority_reason, evidence_fields)
VALUES
  ('ea000000-0000-4000-8000-000000000001', 'da000000-0000-4000-8000-000000000001', 'ba000000-0000-4000-8000-000000000051', '[]'::jsonb, 6538.00, 'strong', 'شقة أولى بسعر منافس', '["سعر ممتاز"]'::jsonb, '[]'::jsonb, '["حالة المصعد"]'::jsonb, 'high', 'أولوية عالية للمعاينة للتأكد من المصعد', ARRAY['listing_price_sar', 'area_sqm']),
  ('ea000000-0000-4000-8000-000000000002', 'da000000-0000-4000-8000-000000000001', 'ba000000-0000-4000-8000-000000000052', '[]'::jsonb, 6814.00, 'strong', 'شقة ثانية مكتملة الشروط', '["مصعد ممتاز"]'::jsonb, '[]'::jsonb, '[]'::jsonb, 'high', 'خيار بديل ممتاز', ARRAY['listing_price_sar', 'area_sqm', 'elevator']);

INSERT INTO public.inspection_items (id, property_id, category, question_ar, why_it_matters_ar, how_to_check_ar, priority, trigger_reason, affected_assessment_types)
VALUES (
  '1a000000-0000-4000-8000-000000000001',
  'ba000000-0000-4000-8000-000000000051',
  'building_services',
  'هل المصعد يعمل وبحالة ممتازة وبصيانة دورية؟',
  'العقار في الدور الثالث والمصعد شرط أساسي',
  'فحص لوحة تشغيل المصعد وطلب كرت الصيانة',
  'high',
  'constraint_verification',
  ARRAY['hard_constraints', 'building_quality']
);

-- ============================================================================
-- CASE F: Riyadh (العليا)
-- Neighborhood amenity (metro station 500m away) preserved as district context, not unit fact
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000006', 'a0000000-0000-4000-8000-000000000001', 'الرياض', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-000000000006', 1200000.00, 'cash', 3, 2);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms)
VALUES ('ba000000-0000-4000-8000-000000000061', 'ca000000-0000-4000-8000-000000000006', 'url', 'شقة العليا قرب محطة القطار', 'العليا', 1100000.00, 115.00, 2);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_text, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000091', 'ba000000-0000-4000-8000-000000000061', 'listing_price_sar', '1100000'::jsonb, '1,100,000 ريال', 'unit', 'url', 'السعر 1.1 مليون', true),
  ('fa000000-0000-4000-8000-000000000092', 'ba000000-0000-4000-8000-000000000061', 'area_sqm', '115'::jsonb, '115 م²', 'unit', 'url', 'المساحة 115', true),
  ('fa000000-0000-4000-8000-000000000093', 'ba000000-0000-4000-8000-000000000061', 'bedrooms', '2'::jsonb, '2 غرف', 'unit', 'url', 'غرفتين', true),
  ('fa000000-0000-4000-8000-000000000094', 'ba000000-0000-4000-8000-000000000061', 'district', '"العليا"'::jsonb, 'العليا', 'unit', 'url', 'حي العليا', true),
  ('fa000000-0000-4000-8000-000000000095', 'ba000000-0000-4000-8000-000000000061', 'listing_claim', '"محطة قطار الرياض على بعد 500 متر"'::jsonb, 'محطة قطار الرياض 500م', 'neighborhood', 'url', 'يبعد 500 متر عن محطة المترو', false);

-- ============================================================================
-- CASE G: Jeddah (الزهراء)
-- Two units in the same building (Apt 4 and Apt 12) with distinct records, preventing identity collapse
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000007', 'a0000000-0000-4000-8000-000000000001', 'جدة', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-000000000007', 800000.00, 'cash', 4, 2);

-- Apt 4: Floor 1
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000071', 'ca000000-0000-4000-8000-000000000007', 'manual', 'عمارة الزهراء - شقة 4 الدور الأول', 'الزهراء', 650000.00, 110.00, 2, 1);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000101', 'ba000000-0000-4000-8000-000000000071', 'listing_price_sar', '650000'::jsonb, '650,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000102', 'ba000000-0000-4000-8000-000000000071', 'floor_no', '1'::jsonb, 'الدور الأول', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000103', 'ba000000-0000-4000-8000-000000000071', 'bedrooms', '2'::jsonb, '2 غرف', 'unit', 'manual', true);

-- Apt 12: Floor 3
INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-000000000072', 'ca000000-0000-4000-8000-000000000007', 'manual', 'عمارة الزهراء - شقة 12 الدور الثالث', 'الزهراء', 720000.00, 125.00, 3, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000104', 'ba000000-0000-4000-8000-000000000072', 'listing_price_sar', '720000'::jsonb, '720,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000105', 'ba000000-0000-4000-8000-000000000072', 'floor_no', '3'::jsonb, 'الدور الثالث', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000106', 'ba000000-0000-4000-8000-000000000072', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true);

-- ============================================================================
-- CASE H: Riyadh (حطين)
-- User alters budget during active analysis, forcing Commit Guard to reject stale run
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000008', 'a0000000-0000-4000-8000-000000000001', 'الرياض', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-000000000008', 900000.00, 'cash', 4, 3);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms)
VALUES ('ba000000-0000-4000-8000-000000000081', 'ca000000-0000-4000-8000-000000000008', 'manual', 'شقة حطين التحليل المتزامن', 'حطين', 850000.00, 130.00, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000111', 'ba000000-0000-4000-8000-000000000081', 'listing_price_sar', '850000'::jsonb, '850,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000112', 'ba000000-0000-4000-8000-000000000081', 'area_sqm', '130'::jsonb, '130 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000113', 'ba000000-0000-4000-8000-000000000081', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true);

-- ============================================================================
-- CASE I: Khobar (الحزام الذهبي)
-- Duplicate payment webhook suppression with single-paid invariant
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-000000000009', 'a0000000-0000-4000-8000-000000000001', 'الخبر', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-000000000009', 1100000.00, 'cash', 4, 3);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-000000000091', 'ca000000-0000-4000-8000-000000000009', 'manual', 'شقة الحزام الذهبي للدفع', 'الحزام الذهبي', 980000.00, 3);

-- ============================================================================
-- CASE J: Dammam (الفاخرية)
-- Blocker for area conflict remains active when user updates an unrelated phone number or district
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-00000000000a', 'a0000000-0000-4000-8000-000000000001', 'الدمام', 'draft', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-00000000000a', 800000.00, 'cash', 4, 3);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-0000000000a1', 'ca000000-0000-4000-8000-00000000000a', 'url', 'شقة الفاخرية - مانع مساحة مستمر', 'الفاخرية', 750000.00, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000121', 'ba000000-0000-4000-8000-0000000000a1', 'area_sqm', '130'::jsonb, '130 م²', 'unit', 'url', true),
  ('fa000000-0000-4000-8000-000000000122', 'ba000000-0000-4000-8000-0000000000a1', 'area_sqm', '115'::jsonb, '115 م²', 'unit', 'image', true),
  ('fa000000-0000-4000-8000-000000000123', 'ba000000-0000-4000-8000-0000000000a1', 'listing_price_sar', '750000'::jsonb, '750,000 ريال', 'unit', 'manual', true);

-- ============================================================================
-- CASE K: Riyadh (الياسمين)
-- Reposted identical ad across multiple portals deduplicated via origin hash; does not inflate confidence
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-00000000000b', 'a0000000-0000-4000-8000-000000000001', 'الرياض', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-00000000000b', 900000.00, 'cash', 4, 3);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-0000000000b1', 'ca000000-0000-4000-8000-00000000000b', 'url', 'شقة الياسمين - إعلان مكرر من نفس المصدر', 'الياسمين', 850000.00, 3);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_text, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000131', 'ba000000-0000-4000-8000-0000000000b1', 'listing_price_sar', '850000'::jsonb, '850,000 ريال', 'unit', 'url', 'إعلان الأصلي', false);

-- ============================================================================
-- CASE L: Jeddah (الروضة)
-- Case soft-deleted while background job is running; commit rejected with case_deleted
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version, deleted_at)
VALUES ('ca000000-0000-4000-8000-00000000000c', 'a0000000-0000-4000-8000-000000000001', 'جدة', 'properties_complete', 1, now());

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-00000000000c', 950000.00, 'cash', 4, 3);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-0000000000c1', 'ca000000-0000-4000-8000-00000000000c', 'manual', 'شقة الروضة المحذوفة مؤقتاً', 'الروضة', 900000.00, 3);

-- ============================================================================
-- CASE M: Khobar (العقربية)
-- Payment gateway callback reporting 5.00 SAR instead of 10.00 SAR sets effect_status = 'mismatch'
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-00000000000d', 'a0000000-0000-4000-8000-000000000001', 'الخبر', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-00000000000d', 1000000.00, 'cash', 4, 3);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-0000000000d1', 'ca000000-0000-4000-8000-00000000000d', 'manual', 'شقة العقربية لمطابقة الدفع', 'العقربية', 850000.00, 3);

-- ============================================================================
-- CASE N: Riyadh (الندى)
-- Session restart / model change resumes accurately from PostgreSQL state without cached memory
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-00000000000e', 'a0000000-0000-4000-8000-000000000001', 'الرياض', 'properties_complete', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms, min_area_sqm)
VALUES ('ca000000-0000-4000-8000-00000000000e', 1100000.00, 'cash', 4, 3, 135.00);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, area_sqm, bedrooms, floor_no)
VALUES ('ba000000-0000-4000-8000-0000000000e1', 'ca000000-0000-4000-8000-00000000000e', 'manual', 'شقة الندى للاستئناف بعد إعادة التشغيل', 'الندى', 980000.00, 140.00, 3, 2);

INSERT INTO public.property_facts (id, property_id, field, value, raw_text, scope, source, evidence_verified)
VALUES
  ('fa000000-0000-4000-8000-000000000141', 'ba000000-0000-4000-8000-0000000000e1', 'listing_price_sar', '980000'::jsonb, '980,000 ريال', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000142', 'ba000000-0000-4000-8000-0000000000e1', 'area_sqm', '140'::jsonb, '140 م²', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000143', 'ba000000-0000-4000-8000-0000000000e1', 'bedrooms', '3'::jsonb, '3 غرف', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000144', 'ba000000-0000-4000-8000-0000000000e1', 'floor_no', '2'::jsonb, 'الدور الثاني', 'unit', 'manual', true),
  ('fa000000-0000-4000-8000-000000000145', 'ba000000-0000-4000-8000-0000000000e1', 'elevator', 'true'::jsonb, 'يوجد مصعد', 'building', 'manual', true);

-- ============================================================================
-- CASE O: Jeddah (السلامة)
-- External API responding HTTP 200 with invalid schema rejected from durable facts
-- ============================================================================
INSERT INTO public.decision_cases (id, owner_id, city, status, state_version)
VALUES ('ca000000-0000-4000-8000-00000000000f', 'a0000000-0000-4000-8000-000000000001', 'جدة', 'draft', 1);

INSERT INTO public.requirements (case_id, max_budget_sar, purchase_method, household_size, min_bedrooms)
VALUES ('ca000000-0000-4000-8000-00000000000f', 800000.00, 'cash', 3, 2);

INSERT INTO public.properties (id, case_id, input_mode, title, district, listing_price_sar, bedrooms)
VALUES ('ba000000-0000-4000-8000-0000000000f1', 'ca000000-0000-4000-8000-00000000000f', 'url', 'شقة السلامة - فحص رفض استجابة خارجية فاسدة', 'السلامة', 700000.00, 2);
