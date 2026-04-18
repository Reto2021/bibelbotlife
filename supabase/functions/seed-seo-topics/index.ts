// Seeds seo_topics (thematic hubs) in all 38 supported languages.
// POST { topics?: string[], languages?: string[], batch?: number, force?: boolean }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPPORTED_LANGS = [
  "de", "en", "fr", "es", "it", "pl", "cs", "pt", "nl", "ro",
  "da", "no", "sv", "fi", "el", "hr", "sr", "hu", "sk", "bg",
  "ru", "uk", "ka", "hy", "ko", "tl", "id", "vi", "zh",
  "sw", "am", "af", "yo", "ig", "zu", "ht", "ar", "he",
];

// 200 curated topics across 12 life-clusters. Each: slug, English seed-question, canonical verse slugs.
const CORE_TOPICS: Array<{ slug: string; seed: string; verses: string[] }> = [
  // === Cluster 1: Faith & Belief (20) ===
  { slug: "love", seed: "What does the Bible say about love?", verses: ["1-corinthians-13-4", "1-john-4-8", "john-3-16"] },
  { slug: "hope", seed: "What does the Bible say about hope?", verses: ["jeremiah-29-11", "romans-15-13", "hebrews-11-1"] },
  { slug: "faith", seed: "What does the Bible say about faith?", verses: ["hebrews-11-1", "ephesians-2-8", "romans-10-17"] },
  { slug: "doubt", seed: "What does the Bible say about doubt?", verses: ["james-1-6", "mark-9-24", "matthew-14-31"] },
  { slug: "trust", seed: "What does the Bible say about trust?", verses: ["proverbs-3-5", "psalms-56-3", "isaiah-26-4"] },
  { slug: "salvation", seed: "What does the Bible say about salvation?", verses: ["john-3-16", "ephesians-2-8", "romans-10-9"] },
  { slug: "grace", seed: "What does the Bible say about grace?", verses: ["ephesians-2-8", "2-corinthians-12-9", "romans-3-24"] },
  { slug: "mercy", seed: "What does the Bible say about mercy?", verses: ["lamentations-3-22", "matthew-5-7", "luke-6-36"] },
  { slug: "holy-spirit", seed: "What does the Bible say about the Holy Spirit?", verses: ["john-14-26", "galatians-5-22", "acts-2-4"] },
  { slug: "jesus", seed: "Who is Jesus according to the Bible?", verses: ["john-14-6", "john-1-1", "philippians-2-9"] },
  { slug: "god", seed: "Who is God according to the Bible?", verses: ["1-john-4-8", "exodus-3-14", "psalms-90-2"] },
  { slug: "trinity", seed: "What does the Bible say about the Trinity?", verses: ["matthew-28-19", "2-corinthians-13-14", "john-14-26"] },
  { slug: "heaven", seed: "What does the Bible say about heaven?", verses: ["john-14-2", "revelation-21-4", "philippians-3-20"] },
  { slug: "hell", seed: "What does the Bible say about hell?", verses: ["matthew-25-46", "revelation-20-15", "mark-9-43"] },
  { slug: "resurrection", seed: "What does the Bible say about resurrection?", verses: ["1-corinthians-15-20", "john-11-25", "romans-6-5"] },
  { slug: "second-coming", seed: "What does the Bible say about the second coming?", verses: ["matthew-24-30", "1-thessalonians-4-16", "revelation-22-12"] },
  { slug: "creation", seed: "What does the Bible say about creation?", verses: ["genesis-1-1", "psalms-19-1", "colossians-1-16"] },
  { slug: "miracles", seed: "What does the Bible say about miracles?", verses: ["mark-9-23", "john-14-12", "matthew-17-20"] },
  { slug: "angels", seed: "What does the Bible say about angels?", verses: ["psalms-91-11", "hebrews-1-14", "matthew-18-10"] },
  { slug: "scripture", seed: "What does the Bible say about scripture itself?", verses: ["2-timothy-3-16", "psalms-119-105", "hebrews-4-12"] },

  // === Cluster 2: Emotions & Mental Health (25) ===
  { slug: "fear", seed: "What does the Bible say about fear?", verses: ["isaiah-41-10", "philippians-4-6", "psalms-23-4"] },
  { slug: "anxiety", seed: "What does the Bible say about anxiety?", verses: ["philippians-4-6", "matthew-6-25", "1-peter-5-7"] },
  { slug: "depression", seed: "What does the Bible say about depression?", verses: ["psalms-34-18", "psalms-42-11", "isaiah-41-10"] },
  { slug: "loneliness", seed: "What does the Bible say about loneliness?", verses: ["psalms-25-16", "deuteronomy-31-6", "matthew-28-20"] },
  { slug: "anger", seed: "What does the Bible say about anger?", verses: ["ephesians-4-26", "james-1-19", "proverbs-15-1"] },
  { slug: "stress", seed: "What does the Bible say about stress?", verses: ["matthew-11-28", "philippians-4-6", "1-peter-5-7"] },
  { slug: "burnout", seed: "What does the Bible say about burnout and exhaustion?", verses: ["matthew-11-28", "isaiah-40-31", "psalms-23-2"] },
  { slug: "shame", seed: "What does the Bible say about shame?", verses: ["romans-8-1", "psalms-34-5", "isaiah-61-7"] },
  { slug: "guilt", seed: "What does the Bible say about guilt?", verses: ["1-john-1-9", "psalms-32-5", "romans-8-1"] },
  { slug: "joy", seed: "What does the Bible say about joy?", verses: ["philippians-4-4", "psalms-16-11", "nehemiah-8-10"] },
  { slug: "peace", seed: "What does the Bible say about peace?", verses: ["philippians-4-7", "john-14-27", "isaiah-26-3"] },
  { slug: "gratitude", seed: "What does the Bible say about gratitude?", verses: ["1-thessalonians-5-18", "psalms-100-4", "colossians-3-17"] },
  { slug: "patience", seed: "What does the Bible say about patience?", verses: ["james-1-4", "romans-12-12", "psalms-37-7"] },
  { slug: "humility", seed: "What does the Bible say about humility?", verses: ["philippians-2-3", "james-4-10", "proverbs-22-4"] },
  { slug: "kindness", seed: "What does the Bible say about kindness?", verses: ["ephesians-4-32", "colossians-3-12", "proverbs-11-17"] },
  { slug: "self-control", seed: "What does the Bible say about self-control?", verses: ["galatians-5-23", "proverbs-25-28", "1-corinthians-9-25"] },
  { slug: "envy", seed: "What does the Bible say about envy and jealousy?", verses: ["james-3-16", "proverbs-14-30", "1-corinthians-13-4"] },
  { slug: "pride", seed: "What does the Bible say about pride?", verses: ["proverbs-16-18", "james-4-6", "1-peter-5-5"] },
  { slug: "courage", seed: "What does the Bible say about courage?", verses: ["joshua-1-9", "deuteronomy-31-6", "psalms-27-1"] },
  { slug: "rest", seed: "What does the Bible say about rest?", verses: ["matthew-11-28", "psalms-23-2", "exodus-20-8"] },
  { slug: "contentment", seed: "What does the Bible say about contentment?", verses: ["philippians-4-11", "1-timothy-6-6", "hebrews-13-5"] },
  { slug: "regret", seed: "What does the Bible say about regret?", verses: ["2-corinthians-7-10", "philippians-3-13", "joel-2-25"] },
  { slug: "bitterness", seed: "What does the Bible say about bitterness?", verses: ["hebrews-12-15", "ephesians-4-31", "colossians-3-13"] },
  { slug: "worry", seed: "What does the Bible say about worry?", verses: ["matthew-6-34", "philippians-4-6", "1-peter-5-7"] },
  { slug: "rejection", seed: "What does the Bible say about rejection?", verses: ["psalms-27-10", "isaiah-41-9", "john-15-18"] },

  // === Cluster 3: Suffering & Crisis (15) ===
  { slug: "suffering", seed: "What does the Bible say about suffering?", verses: ["romans-8-18", "james-1-2", "1-peter-4-12"] },
  { slug: "grief", seed: "What does the Bible say about grief and loss?", verses: ["matthew-5-4", "psalms-34-18", "revelation-21-4"] },
  { slug: "death", seed: "What does the Bible say about death?", verses: ["john-11-25", "1-corinthians-15-55", "revelation-21-4"] },
  { slug: "illness", seed: "What does the Bible say about illness?", verses: ["james-5-14", "psalms-41-3", "isaiah-53-5"] },
  { slug: "healing", seed: "What does the Bible say about healing?", verses: ["isaiah-53-5", "james-5-15", "psalms-147-3"] },
  { slug: "trauma", seed: "What does the Bible say about trauma?", verses: ["psalms-34-18", "2-corinthians-1-3", "isaiah-61-1"] },
  { slug: "abuse", seed: "What does the Bible say about responding to abuse?", verses: ["psalms-34-18", "isaiah-61-1", "psalms-9-9"] },
  { slug: "injustice", seed: "What does the Bible say about injustice?", verses: ["micah-6-8", "isaiah-1-17", "proverbs-31-8"] },
  { slug: "poverty", seed: "What does the Bible say about poverty?", verses: ["proverbs-19-17", "matthew-25-40", "deuteronomy-15-11"] },
  { slug: "hopelessness", seed: "What does the Bible say when life feels hopeless?", verses: ["romans-15-13", "psalms-42-11", "lamentations-3-21"] },
  { slug: "addiction", seed: "What does the Bible say about addiction?", verses: ["1-corinthians-10-13", "romans-7-15", "galatians-5-1"] },
  { slug: "suicide", seed: "What does the Bible say in suicidal crisis?", verses: ["psalms-34-18", "1-kings-19-4", "jeremiah-29-11"] },
  { slug: "persecution", seed: "What does the Bible say about persecution?", verses: ["matthew-5-10", "2-timothy-3-12", "romans-8-35"] },
  { slug: "war", seed: "What does the Bible say about war?", verses: ["matthew-5-9", "isaiah-2-4", "psalms-46-9"] },
  { slug: "natural-disasters", seed: "What does the Bible say about natural disasters?", verses: ["psalms-46-1", "matthew-24-7", "isaiah-43-2"] },

  // === Cluster 4: Relationships (20) ===
  { slug: "marriage", seed: "What does the Bible say about marriage?", verses: ["genesis-2-24", "ephesians-5-25", "1-corinthians-13-4"] },
  { slug: "divorce", seed: "What does the Bible say about divorce?", verses: ["matthew-19-6", "malachi-2-16", "1-corinthians-7-15"] },
  { slug: "dating", seed: "What does the Bible say about dating?", verses: ["2-corinthians-6-14", "1-corinthians-13-4", "song-of-solomon-2-7"] },
  { slug: "singleness", seed: "What does the Bible say about singleness?", verses: ["1-corinthians-7-7", "psalms-37-4", "isaiah-54-5"] },
  { slug: "family", seed: "What does the Bible say about family?", verses: ["proverbs-22-6", "ephesians-6-4", "joshua-24-15"] },
  { slug: "children", seed: "What does the Bible say about raising children?", verses: ["proverbs-22-6", "deuteronomy-6-7", "psalms-127-3"] },
  { slug: "parenting", seed: "What does the Bible say about parenting?", verses: ["proverbs-22-6", "ephesians-6-4", "deuteronomy-6-7"] },
  { slug: "fatherhood", seed: "What does the Bible say about being a father?", verses: ["ephesians-6-4", "psalms-103-13", "proverbs-22-6"] },
  { slug: "motherhood", seed: "What does the Bible say about being a mother?", verses: ["proverbs-31-26", "isaiah-66-13", "titus-2-4"] },
  { slug: "friendship", seed: "What does the Bible say about friendship?", verses: ["proverbs-17-17", "proverbs-27-17", "john-15-13"] },
  { slug: "infidelity", seed: "What does the Bible say about infidelity?", verses: ["exodus-20-14", "hebrews-13-4", "proverbs-6-32"] },
  { slug: "conflict", seed: "What does the Bible say about conflict?", verses: ["matthew-18-15", "romans-12-18", "proverbs-15-1"] },
  { slug: "reconciliation", seed: "What does the Bible say about reconciliation?", verses: ["matthew-5-24", "2-corinthians-5-18", "ephesians-4-32"] },
  { slug: "forgiveness", seed: "What does the Bible say about forgiveness?", verses: ["1-john-1-9", "matthew-6-14", "ephesians-4-32"] },
  { slug: "enemies", seed: "What does the Bible say about loving enemies?", verses: ["matthew-5-44", "romans-12-20", "proverbs-25-21"] },
  { slug: "neighbors", seed: "What does the Bible say about loving neighbors?", verses: ["mark-12-31", "luke-10-27", "leviticus-19-18"] },
  { slug: "community", seed: "What does the Bible say about community?", verses: ["acts-2-42", "hebrews-10-25", "ecclesiastes-4-9"] },
  { slug: "betrayal", seed: "What does the Bible say about betrayal?", verses: ["psalms-41-9", "matthew-26-50", "psalms-55-12"] },
  { slug: "loyalty", seed: "What does the Bible say about loyalty?", verses: ["proverbs-3-3", "ruth-1-16", "proverbs-17-17"] },
  { slug: "boundaries", seed: "What does the Bible say about boundaries?", verses: ["proverbs-4-23", "matthew-5-37", "galatians-6-5"] },

  // === Cluster 5: Purpose & Calling (15) ===
  { slug: "purpose", seed: "What does the Bible say about purpose?", verses: ["jeremiah-29-11", "romans-8-28", "ephesians-2-10"] },
  { slug: "calling", seed: "What does the Bible say about your calling?", verses: ["ephesians-4-1", "romans-11-29", "1-peter-2-9"] },
  { slug: "identity", seed: "What does the Bible say about your identity?", verses: ["2-corinthians-5-17", "ephesians-2-10", "1-peter-2-9"] },
  { slug: "self-worth", seed: "What does the Bible say about self-worth?", verses: ["psalms-139-14", "ephesians-2-10", "matthew-10-31"] },
  { slug: "guidance", seed: "How does the Bible guide decisions?", verses: ["psalms-119-105", "proverbs-3-6", "james-1-5"] },
  { slug: "decisions", seed: "What does the Bible say about making decisions?", verses: ["proverbs-3-5", "james-1-5", "psalms-37-23"] },
  { slug: "wisdom", seed: "What does the Bible say about wisdom?", verses: ["proverbs-3-5", "james-1-5", "proverbs-9-10"] },
  { slug: "discernment", seed: "What does the Bible say about discernment?", verses: ["hebrews-5-14", "1-john-4-1", "philippians-1-9"] },
  { slug: "dreams", seed: "What does the Bible say about dreams and aspirations?", verses: ["psalms-37-4", "proverbs-16-3", "habakkuk-2-2"] },
  { slug: "future", seed: "What does the Bible say about the future?", verses: ["jeremiah-29-11", "proverbs-19-21", "matthew-6-34"] },
  { slug: "change", seed: "What does the Bible say about change?", verses: ["isaiah-43-19", "2-corinthians-5-17", "ecclesiastes-3-1"] },
  { slug: "new-beginnings", seed: "What does the Bible say about new beginnings?", verses: ["isaiah-43-19", "lamentations-3-22", "2-corinthians-5-17"] },
  { slug: "failure", seed: "What does the Bible say about failure?", verses: ["proverbs-24-16", "philippians-3-13", "romans-8-28"] },
  { slug: "success", seed: "What does the Bible say about success?", verses: ["joshua-1-8", "psalms-1-3", "proverbs-16-3"] },
  { slug: "legacy", seed: "What does the Bible say about leaving a legacy?", verses: ["proverbs-13-22", "psalms-78-4", "2-timothy-2-2"] },

  // === Cluster 6: Work & Money (12) ===
  { slug: "work", seed: "What does the Bible say about work?", verses: ["colossians-3-23", "ecclesiastes-3-22", "proverbs-16-3"] },
  { slug: "money", seed: "What does the Bible say about money?", verses: ["1-timothy-6-10", "matthew-6-24", "philippians-4-19"] },
  { slug: "wealth", seed: "What does the Bible say about wealth?", verses: ["proverbs-11-28", "1-timothy-6-17", "matthew-6-19"] },
  { slug: "tithing", seed: "What does the Bible say about tithing?", verses: ["malachi-3-10", "2-corinthians-9-7", "luke-6-38"] },
  { slug: "generosity", seed: "What does the Bible say about generosity?", verses: ["2-corinthians-9-7", "proverbs-11-25", "acts-20-35"] },
  { slug: "stewardship", seed: "What does the Bible say about stewardship?", verses: ["1-peter-4-10", "luke-16-10", "matthew-25-21"] },
  { slug: "debt", seed: "What does the Bible say about debt?", verses: ["proverbs-22-7", "romans-13-8", "psalms-37-21"] },
  { slug: "greed", seed: "What does the Bible say about greed?", verses: ["luke-12-15", "1-timothy-6-10", "ecclesiastes-5-10"] },
  { slug: "honesty", seed: "What does the Bible say about honesty in work?", verses: ["proverbs-11-1", "leviticus-19-11", "colossians-3-9"] },
  { slug: "leadership", seed: "What does the Bible say about leadership?", verses: ["mark-10-43", "1-timothy-3-1", "proverbs-29-2"] },
  { slug: "ambition", seed: "What does the Bible say about ambition?", verses: ["philippians-2-3", "matthew-6-33", "colossians-3-2"] },
  { slug: "retirement", seed: "What does the Bible say about retirement?", verses: ["psalms-71-18", "isaiah-46-4", "psalms-92-14"] },

  // === Cluster 7: Spiritual Life (15) ===
  { slug: "prayer", seed: "What does the Bible say about prayer?", verses: ["matthew-6-9", "philippians-4-6", "1-thessalonians-5-17"] },
  { slug: "worship", seed: "What does the Bible say about worship?", verses: ["psalms-95-6", "john-4-24", "romans-12-1"] },
  { slug: "fasting", seed: "What does the Bible say about fasting?", verses: ["matthew-6-16", "isaiah-58-6", "joel-2-12"] },
  { slug: "meditation", seed: "What does the Bible say about meditation?", verses: ["psalms-1-2", "joshua-1-8", "philippians-4-8"] },
  { slug: "silence", seed: "What does the Bible say about silence?", verses: ["psalms-46-10", "ecclesiastes-3-7", "1-kings-19-12"] },
  { slug: "sabbath", seed: "What does the Bible say about sabbath?", verses: ["exodus-20-8", "mark-2-27", "isaiah-58-13"] },
  { slug: "obedience", seed: "What does the Bible say about obedience?", verses: ["1-samuel-15-22", "john-14-15", "james-1-22"] },
  { slug: "discipleship", seed: "What does the Bible say about discipleship?", verses: ["matthew-28-19", "luke-9-23", "john-13-35"] },
  { slug: "evangelism", seed: "What does the Bible say about evangelism?", verses: ["matthew-28-19", "romans-10-14", "1-peter-3-15"] },
  { slug: "repentance", seed: "What does the Bible say about repentance?", verses: ["acts-3-19", "2-chronicles-7-14", "1-john-1-9"] },
  { slug: "baptism", seed: "What does the Bible say about baptism?", verses: ["matthew-28-19", "acts-2-38", "romans-6-4"] },
  { slug: "communion", seed: "What does the Bible say about communion?", verses: ["1-corinthians-11-23", "luke-22-19", "1-corinthians-10-16"] },
  { slug: "spiritual-gifts", seed: "What does the Bible say about spiritual gifts?", verses: ["1-corinthians-12-4", "romans-12-6", "1-peter-4-10"] },
  { slug: "spiritual-warfare", seed: "What does the Bible say about spiritual warfare?", verses: ["ephesians-6-12", "james-4-7", "2-corinthians-10-4"] },
  { slug: "temptation", seed: "What does the Bible say about temptation?", verses: ["1-corinthians-10-13", "james-1-13", "matthew-26-41"] },

  // === Cluster 8: Ethics & Character (15) ===
  { slug: "truth", seed: "What does the Bible say about truth?", verses: ["john-8-32", "john-14-6", "psalms-119-160"] },
  { slug: "lying", seed: "What does the Bible say about lying?", verses: ["proverbs-12-22", "exodus-20-16", "ephesians-4-25"] },
  { slug: "gossip", seed: "What does the Bible say about gossip?", verses: ["proverbs-16-28", "ephesians-4-29", "james-1-26"] },
  { slug: "judging", seed: "What does the Bible say about judging others?", verses: ["matthew-7-1", "romans-14-13", "james-4-12"] },
  { slug: "revenge", seed: "What does the Bible say about revenge?", verses: ["romans-12-19", "matthew-5-39", "leviticus-19-18"] },
  { slug: "violence", seed: "What does the Bible say about violence?", verses: ["matthew-26-52", "psalms-11-5", "proverbs-3-31"] },
  { slug: "racism", seed: "What does the Bible say about racism?", verses: ["galatians-3-28", "acts-10-34", "revelation-7-9"] },
  { slug: "equality", seed: "What does the Bible say about equality?", verses: ["galatians-3-28", "james-2-1", "acts-10-34"] },
  { slug: "compassion", seed: "What does the Bible say about compassion?", verses: ["colossians-3-12", "matthew-9-36", "1-peter-3-8"] },
  { slug: "service", seed: "What does the Bible say about serving others?", verses: ["mark-10-45", "galatians-5-13", "matthew-25-40"] },
  { slug: "integrity", seed: "What does the Bible say about integrity?", verses: ["proverbs-10-9", "psalms-15-1", "titus-2-7"] },
  { slug: "courage-to-speak", seed: "What does the Bible say about speaking up for what is right?", verses: ["proverbs-31-8", "ephesians-4-15", "1-peter-3-15"] },
  { slug: "pacifism", seed: "What does the Bible say about being a peacemaker?", verses: ["matthew-5-9", "romans-12-18", "hebrews-12-14"] },
  { slug: "creation-care", seed: "What does the Bible say about caring for creation?", verses: ["genesis-2-15", "psalms-24-1", "proverbs-12-10"] },
  { slug: "hospitality", seed: "What does the Bible say about hospitality?", verses: ["hebrews-13-2", "1-peter-4-9", "romans-12-13"] },

  // === Cluster 9: Life Stages (10) ===
  { slug: "youth", seed: "What does the Bible say to young people?", verses: ["1-timothy-4-12", "ecclesiastes-12-1", "psalms-119-9"] },
  { slug: "aging", seed: "What does the Bible say about growing older?", verses: ["psalms-71-9", "isaiah-46-4", "proverbs-16-31"] },
  { slug: "midlife", seed: "What does the Bible say in midlife?", verses: ["psalms-90-12", "ecclesiastes-3-1", "philippians-3-13"] },
  { slug: "pregnancy", seed: "What does the Bible say about pregnancy?", verses: ["psalms-139-13", "jeremiah-1-5", "luke-1-42"] },
  { slug: "miscarriage", seed: "What does the Bible say after miscarriage?", verses: ["psalms-34-18", "2-samuel-12-23", "revelation-21-4"] },
  { slug: "infertility", seed: "What does the Bible say about infertility?", verses: ["1-samuel-1-27", "psalms-113-9", "genesis-30-22"] },
  { slug: "adoption", seed: "What does the Bible say about adoption?", verses: ["ephesians-1-5", "psalms-68-5", "james-1-27"] },
  { slug: "empty-nest", seed: "What does the Bible say in the empty-nest stage?", verses: ["isaiah-43-19", "psalms-71-18", "philippians-3-13"] },
  { slug: "widowhood", seed: "What does the Bible say to widows and widowers?", verses: ["james-1-27", "psalms-68-5", "isaiah-54-5"] },
  { slug: "caregiving", seed: "What does the Bible say about caring for elderly parents?", verses: ["exodus-20-12", "1-timothy-5-4", "proverbs-23-22"] },

  // === Cluster 10: Sacred Texts & Practices (15) ===
  { slug: "ten-commandments", seed: "What are the Ten Commandments?", verses: ["exodus-20-3", "deuteronomy-5-7", "matthew-22-37"] },
  { slug: "lords-prayer", seed: "What is the Lord's Prayer?", verses: ["matthew-6-9", "luke-11-2"] },
  { slug: "beatitudes", seed: "What are the Beatitudes?", verses: ["matthew-5-3", "luke-6-20"] },
  { slug: "psalm-23", seed: "What does Psalm 23 mean?", verses: ["psalms-23-1", "psalms-23-4"] },
  { slug: "fruit-of-spirit", seed: "What is the fruit of the Spirit?", verses: ["galatians-5-22", "galatians-5-23"] },
  { slug: "armor-of-god", seed: "What is the armor of God?", verses: ["ephesians-6-11", "ephesians-6-13"] },
  { slug: "great-commission", seed: "What is the Great Commission?", verses: ["matthew-28-19", "mark-16-15"] },
  { slug: "golden-rule", seed: "What is the Golden Rule?", verses: ["matthew-7-12", "luke-6-31"] },
  { slug: "good-samaritan", seed: "What is the parable of the Good Samaritan?", verses: ["luke-10-25", "luke-10-37"] },
  { slug: "prodigal-son", seed: "What is the parable of the Prodigal Son?", verses: ["luke-15-11", "luke-15-32"] },
  { slug: "exodus-story", seed: "What is the Exodus?", verses: ["exodus-3-14", "exodus-14-21"] },
  { slug: "christmas-story", seed: "What is the Christmas story?", verses: ["luke-2-7", "matthew-1-23"] },
  { slug: "easter-story", seed: "What is the Easter story?", verses: ["matthew-28-6", "1-corinthians-15-3"] },
  { slug: "advent", seed: "What is Advent in the Bible?", verses: ["isaiah-9-6", "luke-1-30"] },
  { slug: "lent", seed: "What is Lent in the Bible?", verses: ["matthew-4-1", "joel-2-12"] },

  // === Cluster 11: Big Questions (15) ===
  { slug: "meaning-of-life", seed: "What does the Bible say about the meaning of life?", verses: ["ecclesiastes-12-13", "matthew-22-37", "micah-6-8"] },
  { slug: "why-suffering", seed: "Why does God allow suffering?", verses: ["romans-8-28", "james-1-2", "1-peter-4-12"] },
  { slug: "free-will", seed: "What does the Bible say about free will?", verses: ["deuteronomy-30-19", "joshua-24-15", "galatians-5-13"] },
  { slug: "predestination", seed: "What does the Bible say about predestination?", verses: ["romans-8-29", "ephesians-1-5", "ephesians-1-11"] },
  { slug: "evil", seed: "What does the Bible say about evil?", verses: ["romans-12-21", "1-john-5-19", "psalms-34-14"] },
  { slug: "sin", seed: "What does the Bible say about sin?", verses: ["romans-3-23", "1-john-1-8", "romans-6-23"] },
  { slug: "judgment", seed: "What does the Bible say about final judgment?", verses: ["revelation-20-12", "2-corinthians-5-10", "matthew-25-31"] },
  { slug: "afterlife", seed: "What does the Bible say about the afterlife?", verses: ["john-14-2", "1-corinthians-15-42", "revelation-21-4"] },
  { slug: "science-and-faith", seed: "How does the Bible relate to science?", verses: ["psalms-19-1", "colossians-1-17", "romans-1-20"] },
  { slug: "other-religions", seed: "What does the Bible say about other religions?", verses: ["acts-17-23", "john-14-6", "1-timothy-2-5"] },
  { slug: "doubt-and-faith", seed: "Is doubt compatible with faith?", verses: ["mark-9-24", "james-1-6", "matthew-14-31"] },
  { slug: "miracles-today", seed: "Do miracles still happen today?", verses: ["hebrews-13-8", "mark-9-23", "john-14-12"] },
  { slug: "end-times", seed: "What does the Bible say about the end times?", verses: ["matthew-24-3", "1-thessalonians-5-2", "revelation-22-12"] },
  { slug: "satan", seed: "What does the Bible say about Satan?", verses: ["1-peter-5-8", "james-4-7", "revelation-12-9"] },
  { slug: "demons", seed: "What does the Bible say about demons?", verses: ["mark-5-9", "ephesians-6-12", "luke-10-17"] },

  // === Cluster 12: Practical Faith (23) ===
  { slug: "morning-devotion", seed: "How to start the day with God?", verses: ["psalms-5-3", "lamentations-3-23", "psalms-143-8"] },
  { slug: "evening-devotion", seed: "How to end the day with God?", verses: ["psalms-4-8", "psalms-63-6", "1-thessalonians-5-18"] },
  { slug: "bible-reading", seed: "How to read the Bible?", verses: ["2-timothy-3-16", "psalms-119-105", "joshua-1-8"] },
  { slug: "memorizing-scripture", seed: "Why memorize scripture?", verses: ["psalms-119-11", "deuteronomy-6-6", "colossians-3-16"] },
  { slug: "small-groups", seed: "Why join a small group?", verses: ["hebrews-10-25", "ecclesiastes-4-9", "acts-2-46"] },
  { slug: "church-attendance", seed: "Why attend church?", verses: ["hebrews-10-25", "psalms-122-1", "matthew-18-20"] },
  { slug: "missions", seed: "What does the Bible say about missions?", verses: ["matthew-28-19", "acts-1-8", "romans-10-15"] },
  { slug: "social-justice", seed: "What does the Bible say about social justice?", verses: ["micah-6-8", "isaiah-1-17", "amos-5-24"] },
  { slug: "environment", seed: "What does the Bible say about the environment?", verses: ["genesis-2-15", "psalms-24-1", "romans-8-22"] },
  { slug: "technology", seed: "How should faith relate to technology?", verses: ["1-corinthians-10-23", "romans-12-2", "philippians-4-8"] },
  { slug: "social-media", seed: "What does the Bible say about social media use?", verses: ["ephesians-4-29", "philippians-4-8", "james-1-19"] },
  { slug: "politics", seed: "What does the Bible say about politics?", verses: ["romans-13-1", "matthew-22-21", "1-timothy-2-1"] },
  { slug: "voting", seed: "Should Christians vote?", verses: ["romans-13-1", "proverbs-29-2", "1-peter-2-13"] },
  { slug: "immigration", seed: "What does the Bible say about immigration?", verses: ["leviticus-19-34", "matthew-25-35", "exodus-22-21"] },
  { slug: "refugees", seed: "What does the Bible say about refugees?", verses: ["matthew-25-35", "leviticus-19-34", "deuteronomy-10-19"] },
  { slug: "homelessness", seed: "What does the Bible say about homelessness?", verses: ["matthew-25-40", "proverbs-19-17", "isaiah-58-7"] },
  { slug: "mental-health", seed: "What does the Bible say about mental health?", verses: ["psalms-34-18", "philippians-4-6", "matthew-11-28"] },
  { slug: "self-care", seed: "What does the Bible say about self-care?", verses: ["mark-6-31", "1-corinthians-6-19", "psalms-23-2"] },
  { slug: "boundaries-relationships", seed: "What does the Bible say about boundaries in relationships?", verses: ["proverbs-22-3", "matthew-5-37", "luke-6-31"] },
  { slug: "forgiving-yourself", seed: "How can I forgive myself?", verses: ["1-john-1-9", "psalms-103-12", "philippians-3-13"] },
  { slug: "asking-forgiveness", seed: "How do I ask for forgiveness?", verses: ["1-john-1-9", "psalms-51-10", "james-5-16"] },
  { slug: "trusting-god-with-children", seed: "How to trust God with my children?", verses: ["proverbs-22-6", "isaiah-54-13", "psalms-127-3"] },
  { slug: "praying-for-others", seed: "How to pray for others?", verses: ["james-5-16", "1-timothy-2-1", "ephesians-6-18"] },

  // === Cluster 15: Featured Q-style ===
  { slug: "what-is-grace", seed: "What is grace in the Bible?", verses: ["ephesians-2-8", "2-corinthians-12-9", "titus-2-11"] },
  { slug: "what-is-sin", seed: "What is sin according to the Bible?", verses: ["1-john-3-4", "romans-3-23", "james-4-17"] },
  { slug: "who-is-jesus", seed: "Who is Jesus and why does it matter?", verses: ["john-14-6", "philippians-2-9", "colossians-1-15"] },
  { slug: "how-to-be-saved", seed: "How can I be saved according to the Bible?", verses: ["romans-10-9", "acts-16-31", "ephesians-2-8"] },
  { slug: "how-to-pray", seed: "How do I pray? A practical guide.", verses: ["matthew-6-9", "philippians-4-6", "james-5-16"] },
];

const LANG_NAME: Record<string, string> = {
  de: "German", en: "English", fr: "French", es: "Spanish", it: "Italian",
  pl: "Polish", cs: "Czech", pt: "Portuguese", nl: "Dutch", ro: "Romanian",
  da: "Danish", no: "Norwegian", sv: "Swedish", fi: "Finnish", el: "Greek",
  hr: "Croatian", sr: "Serbian", hu: "Hungarian", sk: "Slovak", bg: "Bulgarian",
  ru: "Russian", uk: "Ukrainian", ka: "Georgian", hy: "Armenian", ko: "Korean",
  tl: "Tagalog", id: "Indonesian", vi: "Vietnamese", zh: "Chinese (Simplified)",
  sw: "Swahili", am: "Amharic", af: "Afrikaans", yo: "Yoruba", ig: "Igbo",
  zu: "Zulu", ht: "Haitian Creole", ar: "Arabic", he: "Hebrew",
};

function buildPrompt(seed: string, lang: string) {
  const langName = LANG_NAME[lang] || lang;
  return `You are a thoughtful, ecumenical Bible companion writing for a wide audience.
Generate SEO-optimized topical hub content. Question: "${seed}". Write entirely in ${langName}.

Return ONLY a JSON object (no markdown fences):
{
  "title": "Compelling H1 title (max 70 chars) in ${langName}",
  "meta_description": "Compelling meta description (max 160 chars) in ${langName}",
  "intro": "1 short paragraph (~50 words) hooking the reader, in ${langName}",
  "body_md": "3-5 paragraphs of warm, practical insight grounded in scripture. Plain text with double line-breaks between paragraphs. No markdown headings. In ${langName}.",
  "faqs": [
    {"question": "...", "answer": "1-3 sentences"},
    {"question": "...", "answer": "1-3 sentences"},
    {"question": "...", "answer": "1-3 sentences"}
  ]
}

Tone: warm, ecumenical, never preachy, never use the word "AI". Speak directly to the reader.`;
}

async function callLovableAI(prompt: string): Promise<any> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "You generate warm, SEO-optimized topical Bible content. Always return valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    }),
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (res.status === 429) throw new Error("rate-limit");
  if (res.status === 402) throw new Error("payment-required");
  if (!res.ok) throw new Error(`AI error ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content || "{}";
  try {
    return JSON.parse(content);
  } catch {
    const stripped = content.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    return JSON.parse(stripped);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const batchLimit: number = Math.min(body.batch ?? 10, 60);
    const languages: string[] = Array.isArray(body.languages) && body.languages.length
      ? body.languages.filter((l: string) => SUPPORTED_LANGS.includes(l))
      : SUPPORTED_LANGS;
    const onlySlugs: string[] | null = Array.isArray(body.topics) && body.topics.length ? body.topics : null;
    const force: boolean = !!body.force;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const topics = onlySlugs
      ? CORE_TOPICS.filter((t) => onlySlugs.includes(t.slug))
      : CORE_TOPICS;

    // Pre-fetch ALL existing slug+language combos in ONE query (avoids N+1 timeout)
    const existingSet = new Set<string>();
    if (!force) {
      const slugList = topics.map((t) => t.slug);
      const { data: existingRows } = await supabase
        .from("seo_topics")
        .select("slug, language")
        .in("slug", slugList)
        .in("language", languages);
      (existingRows ?? []).forEach((r: any) => existingSet.add(`${r.slug}|${r.language}`));
    }

    const results: Array<{ slug: string; lang: string; status: string; error?: string }> = [];
    let processed = 0;

    outer: for (const topic of topics) {
      for (const lang of languages) {
        if (processed >= batchLimit) break outer;

        if (!force && existingSet.has(`${topic.slug}|${lang}`)) {
          continue; // skip silently; don't bloat results
        }

        try {
          console.log(`[seed] start ${topic.slug}/${lang}`);
          const t0 = Date.now();
          const ai = await callLovableAI(buildPrompt(topic.seed, lang));
          console.log(`[seed] ai-ok ${topic.slug}/${lang} in ${Date.now() - t0}ms`);
          const faqs = Array.isArray(ai.faqs)
            ? ai.faqs
                .filter((f: any) => f?.question && f?.answer)
                .slice(0, 6)
                .map((f: any) => ({ question: String(f.question), answer: String(f.answer) }))
            : [];

          const { error } = await supabase.from("seo_topics").upsert(
            {
              slug: topic.slug,
              language: lang,
              title: String(ai.title || "").slice(0, 200),
              meta_description: String(ai.meta_description || "").slice(0, 200),
              intro: String(ai.intro || ""),
              body_md: String(ai.body_md || ""),
              related_verses: topic.verses,
              faqs: faqs as any,
              is_published: true,
            },
            { onConflict: "slug,language" }
          );
          if (error) throw error;

          processed++;
          results.push({ slug: topic.slug, lang, status: "created" });
          console.log(`[seed] saved ${topic.slug}/${lang} (${processed}/${batchLimit})`);
          await new Promise((r) => setTimeout(r, 300));
        } catch (e: any) {
          console.error(`[seed] error ${topic.slug}/${lang}:`, e?.message ?? String(e));
          results.push({ slug: topic.slug, lang, status: "error", error: e?.message ?? String(e) });
          if (e?.message === "rate-limit" || e?.message === "payment-required") break outer;
        }
      }
    }

    return new Response(
      JSON.stringify({ processed, total: results.length, results, totalTopics: CORE_TOPICS.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: e?.message ?? String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
