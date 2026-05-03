/**
 * Curated seed data — the "data companion" for hand-crafted entries.
 *
 * Add philosophers, schools, works, and associations here.
 * Run `npm run db:seed` to load them. Safe to re-run (idempotent via slug).
 *
 * Date convention: negative integers for BCE (e.g. -399 = 399 BCE).
 * Associations reference other records by slug — IDs are resolved in seed.ts.
 */

import type { NewPhilosopher, NewSchool, NewWork } from '../db/schema.js';

// ── Types for slug-keyed associations ────────────────────────────────────────

export type PhilosopherSchoolSeed = {
  philosopherSlug: string;
  schoolSlug: string;
  role: 'founder' | 'member' | 'student' | 'critic' | 'associated';
};

export type InfluenceSeed = {
  influencerSlug: string;
  influencedSlug: string;
  influenceType: 'direct' | 'indirect' | 'critical' | 'revival';
  description?: string;
};

export type WorkSeed = Omit<NewWork, 'id' | 'philosopherId' | 'createdAt' | 'updatedAt'> & {
  philosopherSlug: string;
};

export type NoteSeed = {
  content: string;
  noteType: 'summary' | 'interpretation' | 'quote' | 'context' | 'bibliography' | 'other';
  philosopherSlug?: string;
  schoolSlug?: string;
  workSlug?: string;
  sourceName?: string;
  sourceUrl?: string;
};

// ── Schools ───────────────────────────────────────────────────────────────────

export const schoolsData: Omit<NewSchool, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    slug: 'presocratic-philosophy',
    name: 'Presocratic Philosophy',
    periodStartYear: -600,
    periodEndYear: -400,
    periodCertainty: 'range',
    description: 'The earliest Greek philosophers, seeking rational explanations of nature without appeal to mythology. Includes the Milesians, Heraclitus, Parmenides, and the Atomists.',
  },
  {
    slug: 'platonism',
    name: 'Platonism',
    periodStartYear: -387,
    periodCertainty: 'circa',
    description: 'Philosophical tradition stemming from Plato, centered on the theory of Forms, the immortality of the soul, and the nature of knowledge as recollection.',
  },
  {
    slug: 'aristotelianism',
    name: 'Aristotelianism',
    periodStartYear: -335,
    periodCertainty: 'circa',
    description: 'Tradition derived from Aristotle, emphasizing empirical observation, logic, and the systematic study of nature, ethics, and politics.',
  },
  {
    slug: 'stoicism',
    name: 'Stoicism',
    periodStartYear: -301,
    periodCertainty: 'circa',
    description: 'School founded by Zeno of Citium, teaching that virtue is the only true good and that one should live in accordance with nature and reason.',
  },
  {
    slug: 'epicureanism',
    name: 'Epicureanism',
    periodStartYear: -307,
    periodCertainty: 'circa',
    description: 'School founded by Epicurus, holding that the highest good is ataraxia (tranquility) and aponia (absence of pain), achievable through simple pleasures and philosophical friendship.',
  },
  {
    slug: 'neoplatonism',
    name: 'Neoplatonism',
    periodStartYear: 245,
    periodCertainty: 'circa',
    description: 'Late antique tradition founded by Plotinus, synthesizing Platonic metaphysics with Aristotelian and Stoic elements into a hierarchical emanationist system. Deeply influential on Christian, Jewish, and Islamic philosophy.',
  },
  {
    slug: 'scholasticism',
    name: 'Scholasticism',
    periodStartYear: 1000,
    periodEndYear: 1400,
    periodCertainty: 'range',
    description: 'Medieval philosophical and theological tradition reconciling Christian faith with classical (especially Aristotelian) reason. Associated with the cathedral schools and universities of Europe.',
  },
  {
    slug: 'rationalism',
    name: 'Rationalism',
    periodStartYear: 1641,
    periodCertainty: 'circa',
    description: 'Early modern tradition holding that reason, rather than sensory experience, is the primary source of knowledge. Associated with Descartes, Spinoza, and Leibniz.',
  },
  {
    slug: 'empiricism',
    name: 'Empiricism',
    periodStartYear: 1689,
    periodCertainty: 'circa',
    description: 'Tradition holding that knowledge derives primarily from sensory experience. Associated with Locke, Berkeley, and Hume.',
  },
  {
    slug: 'utilitarianism',
    name: 'Utilitarianism',
    periodStartYear: 1789,
    periodCertainty: 'circa',
    description: 'Ethical theory holding that the right action maximizes overall well-being or happiness. Founded by Bentham, refined by Mill, and extended by Singer.',
  },
  {
    slug: 'german-idealism',
    name: 'German Idealism',
    periodStartYear: 1781,
    periodEndYear: 1831,
    periodCertainty: 'range',
    description: 'Post-Kantian movement arguing that reality is fundamentally mental or conceptually structured. Includes Fichte, Schelling, and Hegel.',
  },
  {
    slug: 'existentialism',
    name: 'Existentialism',
    periodStartYear: 1840,
    periodCertainty: 'circa',
    description: 'Movement centered on individual existence, freedom, and choice. Associated with Kierkegaard, Nietzsche, Sartre, and de Beauvoir.',
  },
  {
    slug: 'pragmatism',
    name: 'Pragmatism',
    periodStartYear: 1878,
    periodCertainty: 'circa',
    description: 'American philosophical tradition holding that the meaning of ideas lies in their practical consequences and that inquiry is a tool for resolving genuine doubt. Founded by Peirce; developed by James, Dewey, and Mead.',
  },
  {
    slug: 'phenomenology',
    name: 'Phenomenology',
    periodStartYear: 1900,
    periodCertainty: 'circa',
    description: 'Philosophical method focused on the first-person structure of experience. Founded by Husserl; extended and transformed by Heidegger, Merleau-Ponty, and Sartre.',
  },
  {
    slug: 'analytic-philosophy',
    name: 'Analytic Philosophy',
    periodStartYear: 1900,
    periodCertainty: 'circa',
    description: 'Tradition emphasizing clarity, logical analysis, and attention to language. Dominant in Anglophone philosophy since the early twentieth century.',
  },
  {
    slug: 'logical-positivism',
    name: 'Logical Positivism',
    periodStartYear: 1922,
    periodEndYear: 1960,
    periodCertainty: 'range',
    description: 'Vienna Circle movement holding that meaningful statements are either analytic (true by definition) or empirically verifiable. Associated with Schlick, Carnap, and Ayer. Largely dissolved after Quine\'s "Two Dogmas."',
  },
  {
    slug: 'ordinary-language-philosophy',
    name: 'Ordinary Language Philosophy',
    periodStartYear: 1945,
    periodEndYear: 1970,
    periodCertainty: 'range',
    description: 'Oxford-centred movement holding that philosophical problems arise from misuse of ordinary language and dissolve under careful attention to how words are actually used. Associated with Ryle, Austin, Strawson, and Grice.',
  },
  {
    slug: 'hermeneutics',
    name: 'Hermeneutics',
    periodStartYear: 1800,
    periodCertainty: 'circa',
    description: 'Theory and practice of interpretation, especially of texts and historical expressions. Developed by Schleiermacher, Dilthey, Heidegger, and Gadamer into a general philosophical account of human understanding.',
  },
  {
    slug: 'critical-theory',
    name: 'Critical Theory',
    periodStartYear: 1923,
    periodCertainty: 'circa',
    description: 'Tradition associated with the Frankfurt School, synthesizing Hegel, Marx, Freud, and Weber to critique ideology and the conditions for human emancipation. Associated with Horkheimer, Adorno, and Habermas.',
  },
  {
    slug: 'neo-pragmatism',
    name: 'Neo-Pragmatism',
    periodStartYear: 1979,
    periodCertainty: 'circa',
    description: 'Late-twentieth-century revival and transformation of classical pragmatism, combining it with analytic philosophy of language and Hegelian themes. Associated with Rorty, Brandom, and McDowell.',
  },
];

// ── Philosophers ──────────────────────────────────────────────────────────────

export const philosophersData: Omit<NewPhilosopher, 'id' | 'createdAt' | 'updatedAt'>[] = [

  // ── Pre-Socratics ─────────────────────────────────────────────────────────────
  {
    slug: 'heraclitus',
    name: 'Heraclitus',
    bornYear: -535,
    bornCertainty: 'circa',
    diedYear: -475,
    diedCertainty: 'circa',
    nationality: 'Greek',
    bioShort: 'Ephesian philosopher known for the doctrine of universal flux — "everything flows" (panta rhei) — and the unity of opposites. His Logos doctrine posits a rational principle governing all change. Survives only in fragments cited by later authors.',
  },
  {
    slug: 'parmenides',
    name: 'Parmenides',
    bornYear: -515,
    bornCertainty: 'circa',
    diedYear: -450,
    diedCertainty: 'circa',
    nationality: 'Greek',
    bioShort: 'Eleatic philosopher who argued in verse that Being is one, unchanging, and indivisible — and that plurality and change are illusions arising from the senses. His challenge to Heraclitean flux set the terms for all subsequent Greek metaphysics.',
  },
  {
    slug: 'democritus',
    name: 'Democritus',
    bornYear: -460,
    bornCertainty: 'circa',
    diedYear: -370,
    diedCertainty: 'circa',
    nationality: 'Greek',
    bioShort: 'Developed atomic theory alongside Leucippus: all of reality consists of indivisible atoms moving through void. Also wrote extensively on ethics, epistemology, and mathematics, though most works survive only in fragments.',
  },
  {
    slug: 'zeno-of-citium',
    name: 'Zeno of Citium',
    bornYear: -334,
    bornCertainty: 'circa',
    diedYear: -262,
    diedCertainty: 'circa',
    nationality: 'Greek',
    bioShort: 'Founder of Stoicism, who taught in the Stoa Poikile (Painted Porch) in Athens. Held that living according to nature and reason, and cultivating virtue as the sole good, is the path to happiness. His writings survive only in fragments.',
  },

  // ── Classical Greek ───────────────────────────────────────────────────────────
  {
    slug: 'socrates',
    name: 'Socrates',
    bornYear: -470,
    bornCertainty: 'circa',
    diedYear: -399,
    diedCertainty: 'exact',
    nationality: 'Greek',
    bioShort: 'Athenian philosopher who wrote nothing himself but shaped Western thought through his method of questioning (elenchus). Tried and executed for impiety and corrupting youth.',
  },
  {
    slug: 'plato',
    name: 'Plato',
    alsoKnownAs: 'Aristocles',
    bornYear: -428,
    bornCertainty: 'circa',
    diedYear: -348,
    diedCertainty: 'circa',
    nationality: 'Greek',
    bioShort: 'Student of Socrates and teacher of Aristotle. Founded the Academy in Athens. Developed the theory of Forms and wrote in dialogue form, with Socrates as the central interlocutor.',
  },
  {
    slug: 'aristotle',
    name: 'Aristotle',
    bornYear: -384,
    bornCertainty: 'exact',
    diedYear: -322,
    diedCertainty: 'exact',
    nationality: 'Greek',
    bioShort: 'Student of Plato and tutor of Alexander the Great. Founded the Lyceum. His works range across logic, biology, physics, ethics, politics, and poetics.',
  },
  {
    slug: 'epicurus',
    name: 'Epicurus',
    bornYear: -341,
    bornCertainty: 'exact',
    diedYear: -270,
    diedCertainty: 'exact',
    nationality: 'Greek',
    bioShort: 'Founder of the Garden school in Athens. Taught that the good life consists in ataraxia and aponia, achieved through friendship, modest pleasures, and freedom from fear.',
  },

  // ── Hellenistic & Roman ───────────────────────────────────────────────────────
  {
    slug: 'marcus-aurelius',
    name: 'Marcus Aurelius',
    bornYear: 121,
    bornCertainty: 'exact',
    diedYear: 180,
    diedCertainty: 'exact',
    nationality: 'Roman',
    bioShort: 'Roman Emperor and Stoic philosopher. His private journal, the Meditations, was never intended for publication and remains one of the most direct expressions of Stoic practice.',
  },
  {
    slug: 'plotinus',
    name: 'Plotinus',
    bornYear: 204,
    bornCertainty: 'circa',
    diedYear: 270,
    diedCertainty: 'exact',
    nationality: 'Roman',
    bioShort: 'Founder of Neoplatonism. His Enneads (edited by Porphyry) articulate a hierarchical emanationist metaphysics: from the One proceeds Intellect (Nous), then Soul, then Matter. Deeply influential on Augustine and on Islamic and Jewish philosophy.',
  },

  // ── Medieval ─────────────────────────────────────────────────────────────────
  {
    slug: 'augustine',
    name: 'Augustine of Hippo',
    alsoKnownAs: 'Saint Augustine',
    bornYear: 354,
    bornCertainty: 'exact',
    diedYear: 430,
    diedCertainty: 'exact',
    nationality: 'Roman',
    bioShort: 'Bishop of Hippo and the most influential theologian of Western Christianity. Synthesized Neoplatonism with Christian doctrine. His Confessions pioneered the philosophical autobiography; The City of God articulated the theology of history.',
  },
  {
    slug: 'thomas-aquinas',
    name: 'Thomas Aquinas',
    alsoKnownAs: 'Doctor Angelicus',
    bornYear: 1225,
    bornCertainty: 'exact',
    diedYear: 1274,
    diedCertainty: 'exact',
    nationality: 'Italian',
    bioShort: 'Dominican friar and the defining philosopher of Scholasticism. His synthesis of Aristotelian philosophy with Christian theology — Thomism — remains the official philosophical framework of the Catholic Church.',
  },
  {
    slug: 'william-of-ockham',
    name: 'William of Ockham',
    alsoKnownAs: 'Ockham, Occam',
    bornYear: 1287,
    bornCertainty: 'circa',
    diedYear: 1347,
    diedCertainty: 'circa',
    nationality: 'English',
    bioShort: 'Franciscan philosopher and nominalist. "Ockham\'s Razor" (entities should not be multiplied beyond necessity) challenges realism about universals. His nominalism and anti-papal political writings made him a controversial figure.',
  },
  {
    slug: 'john-buridan',
    name: 'John Buridan',
    alsoKnownAs: 'Jean Buridan, Joannes Buridanus',
    bornYear: 1301,
    bornCertainty: 'circa',
    diedYear: 1361,
    diedCertainty: 'circa',
    nationality: 'French',
    bioShort: 'Parisian arts master and the most influential medieval logician of the 14th century. His Tractatus de consequentiis and Summulae de dialectica systematised modal syllogistic, the theory of consequences, and supposition theory. Sceptical nominalist in Ockham\'s wake; the so-called "Buridan\'s ass" thought experiment is mis-attributed but illustrates his interest in indifferent choice.',
  },

  // ── Early Modern ─────────────────────────────────────────────────────────────
  {
    slug: 'francis-bacon',
    name: 'Francis Bacon',
    bornYear: 1561,
    bornCertainty: 'exact',
    diedYear: 1626,
    diedCertainty: 'exact',
    nationality: 'English',
    bioShort: 'Statesman and philosopher who championed inductive method and empirical science over Aristotelian scholasticism. His Novum Organum argues for systematic observation and experiment as the basis of natural knowledge.',
  },
  {
    slug: 'thomas-hobbes',
    name: 'Thomas Hobbes',
    bornYear: 1588,
    bornCertainty: 'exact',
    diedYear: 1679,
    diedCertainty: 'exact',
    nationality: 'English',
    bioShort: 'Materialist philosopher and political theorist. Leviathan argues that without a sovereign authority, human life would be "solitary, poor, nasty, brutish, and short," grounding political obligation in a social contract.',
  },
  {
    slug: 'baruch-spinoza',
    name: 'Baruch Spinoza',
    alsoKnownAs: 'Benedictus de Spinoza',
    bornYear: 1632,
    bornCertainty: 'exact',
    diedYear: 1677,
    diedCertainty: 'exact',
    nationality: 'Dutch',
    bioShort: 'Rationalist metaphysician who argued that God and Nature are identical (Deus sive Natura) — one infinite substance with infinite attributes. Excommunicated from the Amsterdam Jewish community. His Ethics is written in geometric form.',
  },
  {
    slug: 'john-locke',
    name: 'John Locke',
    bornYear: 1632,
    bornCertainty: 'exact',
    diedYear: 1704,
    diedCertainty: 'exact',
    nationality: 'English',
    bioShort: 'Father of classical liberalism and British empiricism. The Essay Concerning Human Understanding argues the mind is a tabula rasa; the Two Treatises ground government in consent and the protection of natural rights.',
  },
  {
    slug: 'gottfried-leibniz',
    name: 'Gottfried Wilhelm Leibniz',
    bornYear: 1646,
    bornCertainty: 'exact',
    diedYear: 1716,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Polymath who independently invented the calculus (alongside Newton) and developed a rationalist metaphysics of monads — simple, windowless substances — and pre-established harmony. His theodicy argues this is the best of all possible worlds.',
  },
  {
    slug: 'george-berkeley',
    name: 'George Berkeley',
    bornYear: 1685,
    bornCertainty: 'exact',
    diedYear: 1753,
    diedCertainty: 'exact',
    nationality: 'Irish',
    bioShort: 'Idealist philosopher who argued that material substance is a fiction — to be is to be perceived (esse est percipi). Only minds and their ideas exist. His immaterialism was partly a defense of common sense against Lockean skepticism.',
  },
  {
    slug: 'rene-descartes',
    name: 'René Descartes',
    bornYear: 1596,
    bornCertainty: 'exact',
    diedYear: 1650,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Mathematician and philosopher who sought to rebuild knowledge on indubitable foundations. The cogito argument and mind-body dualism are his most influential contributions.',
  },
  {
    slug: 'jean-jacques-rousseau',
    name: 'Jean-Jacques Rousseau',
    bornYear: 1712,
    bornCertainty: 'exact',
    diedYear: 1778,
    diedCertainty: 'exact',
    nationality: 'Genevan',
    bioShort: 'Political philosopher and critic of civilization who argued that humans are naturally good but corrupted by society. The Social Contract ("Man is born free, and everywhere he is in chains") and the Discourse on Inequality were formative for the French Revolution and Kant.',
  },

  // ── 18th–19th Century ─────────────────────────────────────────────────────────
  {
    slug: 'david-hume',
    name: 'David Hume',
    bornYear: 1711,
    bornCertainty: 'exact',
    diedYear: 1776,
    diedCertainty: 'exact',
    nationality: 'Scottish',
    bioShort: 'Empiricist philosopher and historian who argued that all knowledge derives from experience. His skepticism about causation and the self profoundly influenced Kant.',
  },
  {
    slug: 'immanuel-kant',
    name: 'Immanuel Kant',
    bornYear: 1724,
    bornCertainty: 'exact',
    diedYear: 1804,
    diedCertainty: 'exact',
    nationality: 'Prussian',
    bioShort: 'Central figure of the Enlightenment. The three Critiques attempted a synthesis of rationalism and empiricism, and founded the project of transcendental idealism.',
  },
  {
    slug: 'jeremy-bentham',
    name: 'Jeremy Bentham',
    bornYear: 1748,
    bornCertainty: 'exact',
    diedYear: 1832,
    diedCertainty: 'exact',
    nationality: 'English',
    bioShort: 'Founder of utilitarianism and legal reformer. Held that the greatest happiness of the greatest number is the measure of right and wrong. His auto-icon (preserved remains) is displayed at University College London.',
  },
  {
    slug: 'john-stuart-mill',
    name: 'John Stuart Mill',
    bornYear: 1806,
    bornCertainty: 'exact',
    diedYear: 1873,
    diedCertainty: 'exact',
    nationality: 'English',
    bioShort: 'The preeminent Victorian philosopher, who refined Benthamite utilitarianism to distinguish quality of pleasures, defended individual liberty against social tyranny, and championed women\'s suffrage. His Logic systematized inductive method.',
  },
  {
    slug: 'arthur-schopenhauer',
    name: 'Arthur Schopenhauer',
    bornYear: 1788,
    bornCertainty: 'exact',
    diedYear: 1860,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Post-Kantian philosopher who argued that behind the phenomenal world lies a blind, striving Will — and that the good life consists in aesthetic contemplation and ascetic denial of the will. Influenced Nietzsche, Wagner, and Freud.',
  },
  {
    slug: 'franz-brentano',
    name: 'Franz Brentano',
    bornYear: 1838,
    bornCertainty: 'exact',
    diedYear: 1917,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Philosopher and psychologist who revived the Scholastic concept of intentionality: all mental acts are directed at objects. His Psychology from an Empirical Standpoint directly inspired Husserl\'s phenomenology.',
  },
  {
    slug: 'wilhelm-dilthey',
    name: 'Wilhelm Dilthey',
    bornYear: 1833,
    bornCertainty: 'exact',
    diedYear: 1911,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Philosopher of history and hermeneutics who argued that the human sciences (Geisteswissenschaften) require a distinct method — Verstehen (understanding) — irreducible to natural-scientific explanation. Foundational for Gadamer and Ricoeur.',
  },

  // ── German Idealism ───────────────────────────────────────────────────────────
  {
    slug: 'fichte',
    name: 'Johann Gottlieb Fichte',
    bornYear: 1762,
    bornCertainty: 'exact',
    diedYear: 1814,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Post-Kantian idealist who grounded Kant\'s system in the self-positing activity of the I (Ich). His Wissenschaftslehre attempts to derive the structure of experience from a single first principle. Hegel saw his position as one-sided subjective idealism.',
  },
  {
    slug: 'schelling',
    name: 'F. W. J. Schelling',
    alsoKnownAs: 'Friedrich Wilhelm Joseph Schelling',
    bornYear: 1775,
    bornCertainty: 'exact',
    diedYear: 1854,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'German Idealist who developed a philosophy of nature and an identity-philosophy treating the Absolute as the indifference point of subject and object. An early collaborator with Hegel; their relationship became strained after Hegel\'s rise.',
  },
  {
    slug: 'hegel',
    name: 'G. W. F. Hegel',
    alsoKnownAs: 'Georg Wilhelm Friedrich Hegel',
    bornYear: 1770,
    bornCertainty: 'exact',
    diedYear: 1831,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Post-Kantian idealist who developed a dialectical account of history and spirit (Geist). His system — spanning logic, nature, and mind — argues that reality is the self-development of Absolute Spirit coming to know itself through human history, culture, and philosophy. His influence ramifies across Marxism, existentialism, analytic philosophy, critical theory, and hermeneutics.',
  },

  // ── 19th Century ─────────────────────────────────────────────────────────────
  {
    slug: 'kierkegaard',
    name: 'Søren Kierkegaard',
    bornYear: 1813,
    bornCertainty: 'exact',
    diedYear: 1855,
    diedCertainty: 'exact',
    nationality: 'Danish',
    bioShort: 'Philosopher and theologian who wrote under multiple pseudonyms to enact rather than merely describe the existential stages of life. His critique of Hegel\'s System — that it leaves no room for the existing, choosing, suffering individual — is the founding gesture of existentialism.',
  },
  {
    slug: 'marx',
    name: 'Karl Marx',
    bornYear: 1818,
    bornCertainty: 'exact',
    diedYear: 1883,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Philosopher, economist, and revolutionary who inverted Hegel\'s idealist dialectic: the motor of history is not Spirit\'s self-recognition but the material forces and relations of production. Co-author (with Engels) of the Communist Manifesto; author of Capital.',
  },
  {
    slug: 'nietzsche',
    name: 'Friedrich Nietzsche',
    bornYear: 1844,
    bornCertainty: 'exact',
    diedYear: 1900,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Critic of morality, religion, and systematic philosophy. Introduced concepts of the will to power, eternal recurrence, and the Übermensch. Wrote in aphorism and polemic.',
  },
  {
    slug: 'gottlob-frege',
    name: 'Gottlob Frege',
    bornYear: 1848,
    bornCertainty: 'exact',
    diedYear: 1925,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Mathematician-logician who founded modern logic and the philosophy of language. His Begriffsschrift (1879) invented quantificational logic; the distinction between Sinn (sense) and Bedeutung (reference) is one of the most productive in analytic philosophy. Russell\'s paradox undermined his logicist program.',
  },

  // ── Pragmatists ───────────────────────────────────────────────────────────────
  {
    slug: 'charles-peirce',
    name: 'Charles Sanders Peirce',
    bornYear: 1839,
    bornCertainty: 'exact',
    diedYear: 1914,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Founder of pragmatism (which he later renamed pragmaticism to distinguish it from James\'s version). Contributed to logic, semiotics, and the philosophy of science. His maxim: the meaning of a concept lies in its conceivable practical effects.',
  },
  {
    slug: 'william-james',
    name: 'William James',
    bornYear: 1842,
    bornCertainty: 'exact',
    diedYear: 1910,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Psychologist and philosopher who popularized pragmatism and developed radical empiricism. His Principles of Psychology (1890) founded scientific psychology in America; Pragmatism (1907) made the movement a cultural force. Also wrote on religious experience and the will to believe.',
  },
  {
    slug: 'john-dewey',
    name: 'John Dewey',
    bornYear: 1859,
    bornCertainty: 'exact',
    diedYear: 1952,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'The most influential American philosopher of the twentieth century. Developed instrumentalism — knowledge as a tool for solving problems — and applied it to education, democracy, and social reform. His Logic: The Theory of Inquiry is the fullest statement of his naturalism.',
  },
  {
    slug: 'george-herbert-mead',
    name: 'George Herbert Mead',
    bornYear: 1863,
    bornCertainty: 'exact',
    diedYear: 1931,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Social philosopher and pragmatist who developed a theory of the self as constituted through social interaction and language. Mind, Self, and Society (compiled from student notes) is the foundational text of symbolic interactionism.',
  },
  {
    slug: 'ci-lewis',
    name: 'C. I. Lewis',
    alsoKnownAs: 'Clarence Irving Lewis',
    bornYear: 1883,
    bornCertainty: 'exact',
    diedYear: 1964,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Pragmatist philosopher who founded modern modal logic and developed conceptualistic pragmatism — the view that the categories we apply to experience are pragmatically chosen frameworks. A crucial bridge between the classical pragmatists and Quine\'s generation.',
  },

  // ── Early Analytic ────────────────────────────────────────────────────────────
  {
    slug: 'bertrand-russell',
    name: 'Bertrand Russell',
    bornYear: 1872,
    bornCertainty: 'exact',
    diedYear: 1970,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Co-founder of analytic philosophy and mathematical logic. With Whitehead, wrote Principia Mathematica attempting to ground arithmetic in logic. His theory of descriptions, logical atomism, and prolific popular writings on ethics, education, and politics shaped the twentieth century.',
  },
  {
    slug: 'ge-moore',
    name: 'G. E. Moore',
    alsoKnownAs: 'George Edward Moore',
    bornYear: 1873,
    bornCertainty: 'exact',
    diedYear: 1958,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Co-founder of analytic philosophy whose Principia Ethica argued that "good" is a simple, non-natural property — defining it in natural terms commits the "naturalistic fallacy." His commonsensism and attention to ordinary language were also highly influential.',
  },
  {
    slug: 'alfred-whitehead',
    name: 'Alfred North Whitehead',
    bornYear: 1861,
    bornCertainty: 'exact',
    diedYear: 1947,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Mathematician and philosopher who co-authored Principia Mathematica with Russell before developing process philosophy — a metaphysics in which events and processes, not substances, are fundamental. Process and Reality remains his major metaphysical work.',
  },
  {
    slug: 'wittgenstein',
    name: 'Ludwig Wittgenstein',
    bornYear: 1889,
    bornCertainty: 'exact',
    diedYear: 1951,
    diedCertainty: 'exact',
    nationality: 'Austrian',
    bioShort: 'Two distinct phases: the Tractatus (logical atomism, picture theory of meaning) and the Investigations (language games, family resemblance, anti-essentialism). Perhaps the most discussed philosopher of the twentieth century.',
  },

  // ── Vienna Circle / Logical Positivism ────────────────────────────────────────
  {
    slug: 'moritz-schlick',
    name: 'Moritz Schlick',
    bornYear: 1882,
    bornCertainty: 'exact',
    diedYear: 1936,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Founder of the Vienna Circle and the leading figure of logical positivism. Held that philosophy\'s task is the clarification of meaning via the verification principle. Assassinated on the steps of the University of Vienna by a former student.',
  },
  {
    slug: 'rudolf-carnap',
    name: 'Rudolf Carnap',
    bornYear: 1891,
    bornCertainty: 'exact',
    diedYear: 1970,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'The most technically sophisticated member of the Vienna Circle. Developed the program of rational reconstruction, inductive logic, and linguistic frameworks. His distinction between internal and external questions anticipates later debates about ontology. Quine\'s "Two Dogmas" is principally directed against Carnap.',
  },
  {
    slug: 'aj-ayer',
    name: 'A. J. Ayer',
    alsoKnownAs: 'Alfred Jules Ayer',
    bornYear: 1910,
    bornCertainty: 'exact',
    diedYear: 1989,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Brought logical positivism to a British audience with Language, Truth and Logic (1936), written at age 24. The verification criterion of meaning — that a statement is meaningful only if it is analytic or empirically verifiable — became a touchstone for and target of subsequent philosophy.',
  },

  // ── Ordinary Language Philosophy ──────────────────────────────────────────────
  {
    slug: 'gilbert-ryle',
    name: 'Gilbert Ryle',
    bornYear: 1900,
    bornCertainty: 'exact',
    diedYear: 1976,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Oxford philosopher whose Concept of Mind (1949) attacked Descartes\'s "ghost in the machine" by arguing that mind-talk describes dispositions to behave, not a separate mental substance. Coined the term "category mistake."',
  },
  {
    slug: 'jl-austin',
    name: 'J. L. Austin',
    alsoKnownAs: 'John Langshaw Austin',
    bornYear: 1911,
    bornCertainty: 'exact',
    diedYear: 1960,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Oxford philosopher who developed speech act theory — the distinction between locutionary, illocutionary, and perlocutionary acts. How to Do Things with Words articulated what we do with language beyond describing the world. Died at 48, leaving much unwritten.',
  },
  {
    slug: 'pf-strawson',
    name: 'P. F. Strawson',
    alsoKnownAs: 'Peter Frederick Strawson',
    bornYear: 1919,
    bornCertainty: 'exact',
    diedYear: 2006,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Oxford philosopher who challenged Russell\'s theory of descriptions, developed a descriptive metaphysics of persons and material bodies, and wrote a landmark critique of Kant. His "Freedom and Resentment" (1962) transformed the philosophy of moral responsibility.',
  },
  {
    slug: 'hp-grice',
    name: 'H. P. Grice',
    alsoKnownAs: 'Herbert Paul Grice',
    bornYear: 1913,
    bornCertainty: 'exact',
    diedYear: 1988,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Philosopher of language who distinguished what is said from what is implicated (conversational implicature) and articulated the cooperative maxims governing communication. "Logic and Conversation" is among the most cited papers in philosophy of language.',
  },

  // ── Phenomenology & Continental ───────────────────────────────────────────────
  {
    slug: 'edmund-husserl',
    name: 'Edmund Husserl',
    bornYear: 1859,
    bornCertainty: 'exact',
    diedYear: 1938,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Founder of phenomenology. Developed the phenomenological method — bracketing the natural attitude to describe the essential structures of consciousness and its intentional objects. Influenced Heidegger, Merleau-Ponty, Sartre, and Levinas.',
  },
  {
    slug: 'martin-heidegger',
    name: 'Martin Heidegger',
    bornYear: 1889,
    bornCertainty: 'exact',
    diedYear: 1976,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Student of Husserl who transformed phenomenology into an analysis of Being and human existence (Dasein). Being and Time (1927) is the most influential continental philosophy work of the century. His Nazi involvement remains deeply controversial.',
  },
  {
    slug: 'jean-paul-sartre',
    name: 'Jean-Paul Sartre',
    bornYear: 1905,
    bornCertainty: 'exact',
    diedYear: 1980,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Existentialist philosopher, novelist, and playwright. Existence precedes essence: humans have no fixed nature, only radical freedom and the anguish of responsibility. Being and Nothingness (1943) is the systematic statement; "Existentialism is a Humanism" popularized the movement.',
  },
  {
    slug: 'maurice-merleau-ponty',
    name: 'Maurice Merleau-Ponty',
    bornYear: 1908,
    bornCertainty: 'exact',
    diedYear: 1961,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Phenomenologist who argued that perception is fundamentally embodied — the lived body (corps propre) is the primary locus of experience, not the detached Cartesian mind. Phenomenology of Perception (1945) remains the key text in philosophy of embodiment.',
  },
  {
    slug: 'emmanuel-levinas',
    name: 'Emmanuel Levinas',
    bornYear: 1906,
    bornCertainty: 'exact',
    diedYear: 1995,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Philosopher of ethics and alterity who argued that the encounter with the Other\'s face issues an infinite, asymmetrical ethical demand prior to all ontology. Totality and Infinity (1961) and Otherwise Than Being (1974) are the major works.',
  },
  {
    slug: 'hannah-arendt',
    name: 'Hannah Arendt',
    bornYear: 1906,
    bornCertainty: 'exact',
    diedYear: 1975,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Political philosopher and historian of ideas. The Origins of Totalitarianism, The Human Condition (distinguishing labor, work, and action), and Eichmann in Jerusalem (coining "the banality of evil") are her three most influential works.',
  },
  {
    slug: 'hans-georg-gadamer',
    name: 'Hans-Georg Gadamer',
    bornYear: 1900,
    bornCertainty: 'exact',
    diedYear: 2002,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Philosopher of hermeneutics whose Truth and Method (1960) argued that understanding is always historically situated, mediated by tradition and language, and irreducible to method. The "fusion of horizons" is his model of how past and present meet in interpretation.',
  },
  {
    slug: 'paul-ricoeur',
    name: 'Paul Ricoeur',
    bornYear: 1913,
    bornCertainty: 'exact',
    diedYear: 2005,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Philosopher who combined phenomenology, hermeneutics, and narrative theory. Time and Narrative argues that human experience is fundamentally temporal and story-shaped; Oneself as Another develops a hermeneutics of personal identity.',
  },
  {
    slug: 'michel-foucault',
    name: 'Michel Foucault',
    bornYear: 1926,
    bornCertainty: 'exact',
    diedYear: 1984,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Historian of ideas and theorist of power-knowledge. His genealogical analyses of madness, medicine, the prison, and sexuality showed how regimes of truth shape and constrain human subjects. Among the most cited scholars in the humanities.',
  },
  {
    slug: 'jacques-derrida',
    name: 'Jacques Derrida',
    bornYear: 1930,
    bornCertainty: 'exact',
    diedYear: 2004,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Philosopher who developed deconstruction — a reading practice exposing the hidden binary oppositions and aporias in texts, including philosophical ones. Of Grammatology (1967) and Writing and Difference are foundational. His work generated enormous controversy in Anglophone academia.',
  },
  {
    slug: 'jurgen-habermas',
    name: 'Jürgen Habermas',
    bornYear: 1929,
    bornCertainty: 'exact',
    nationality: 'German',
    bioShort: 'The leading second-generation Frankfurt School theorist. The Theory of Communicative Action grounds critical theory in an analysis of communicative rationality and the pragmatics of discourse. Has engaged extensively with analytic philosophy, Rawls, and Rorty.',
  },
  {
    slug: 'theodor-adorno',
    name: 'Theodor W. Adorno',
    bornYear: 1903,
    bornCertainty: 'exact',
    diedYear: 1969,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Frankfurt School philosopher, musicologist, and cultural critic. Co-authored Dialectic of Enlightenment with Horkheimer; wrote Negative Dialectics as an extended polemic against identity thinking. His aesthetics remains one of the richest in the twentieth century.',
  },
  {
    slug: 'walter-benjamin',
    name: 'Walter Benjamin',
    bornYear: 1892,
    bornCertainty: 'exact',
    diedYear: 1940,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Critic, essayist, and philosopher affiliated with the Frankfurt School. His essays on the aura of art, the flaneur, and messianic historical time are among the most read in twentieth-century cultural theory. Died fleeing the Nazis at the Spanish border.',
  },
  {
    slug: 'herbert-marcuse',
    name: 'Herbert Marcuse',
    bornYear: 1898,
    bornCertainty: 'exact',
    diedYear: 1979,
    diedCertainty: 'exact',
    nationality: 'German',
    bioShort: 'Frankfurt School philosopher whose Eros and Civilization synthesized Freud and Marx, and One-Dimensional Man diagnosed late-capitalist society\'s repression of critical thought. A major intellectual influence on the New Left and 1968 movements.',
  },
  {
    slug: 'gilles-deleuze',
    name: 'Gilles Deleuze',
    bornYear: 1925,
    bornCertainty: 'exact',
    diedYear: 1995,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Philosopher who developed a philosophy of difference, multiplicity, and becoming against representational and identity-based thinking. Difference and Repetition (1968) and the two volumes of Capitalism and Schizophrenia (with Guattari) are his major works.',
  },
  {
    slug: 'de-beauvoir',
    name: 'Simone de Beauvoir',
    bornYear: 1908,
    bornCertainty: 'exact',
    diedYear: 1986,
    diedCertainty: 'exact',
    nationality: 'French',
    bioShort: 'Existentialist philosopher and feminist theorist. The Second Sex established the framework of woman as Other and laid groundwork for second-wave feminism.',
  },

  // ── Mid-Century Analytic ──────────────────────────────────────────────────────
  {
    slug: 'wvo-quine',
    name: 'W. V. O. Quine',
    alsoKnownAs: 'Willard Van Orman Quine',
    bornYear: 1908,
    bornCertainty: 'exact',
    diedYear: 2000,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'The most influential American analytic philosopher of the mid-century. "Two Dogmas of Empiricism" demolished the analytic-synthetic distinction and verification theory; Word and Object argued for ontological relativity. His naturalism made epistemology continuous with science.',
  },
  {
    slug: 'nelson-goodman',
    name: 'Nelson Goodman',
    bornYear: 1906,
    bornCertainty: 'exact',
    diedYear: 1998,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher of logic, language, and art. Fact, Fiction, and Forecast posed the "new riddle of induction" (grue); Languages of Art developed a symbol-theoretic account of the arts; Ways of Worldmaking advanced a radical irrealism about multiple world-versions.',
  },
  {
    slug: 'ruth-barcan-marcus',
    name: 'Ruth Barcan Marcus',
    bornYear: 1921,
    bornCertainty: 'exact',
    diedYear: 2012,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Logician and philosopher who pioneered quantified modal logic and argued for the necessity of identity and direct reference — anticipating by decades many positions Kripke would later make famous. The "Barcan formula" is named for her.',
  },
  {
    slug: 'donald-davidson',
    name: 'Donald Davidson',
    bornYear: 1917,
    bornCertainty: 'exact',
    diedYear: 2003,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher of action, mind, and language. "Truth and Meaning" proposed truth-theoretic semantics; "Mental Events" defended anomalous monism; "On the Very Idea of a Conceptual Scheme" argued against the scheme-content dualism that Quine had inherited.',
  },
  {
    slug: 'saul-kripke',
    name: 'Saul Kripke',
    bornYear: 1940,
    bornCertainty: 'exact',
    diedYear: 2022,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Logician and philosopher who revolutionized modal logic (Kripke semantics) and the philosophy of language. Naming and Necessity (1972/1980) established rigid designators, a posteriori necessity, and the causal theory of reference. Wittgenstein on Rules challenged the rule-following sections of the Investigations.',
  },
  {
    slug: 'hilary-putnam',
    name: 'Hilary Putnam',
    bornYear: 1926,
    bornCertainty: 'exact',
    diedYear: 2016,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher who passed through functionalism, scientific realism, internal realism, and pragmatism, always changing his mind in public. "The Meaning of Meaning" introduced Twin Earth and semantic externalism; his later pragmatism engaged seriously with Wittgenstein, Dewey, and James.',
  },
  {
    slug: 'michael-dummett',
    name: 'Michael Dummett',
    bornYear: 1925,
    bornCertainty: 'exact',
    diedYear: 2011,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Philosopher of language and logic who argued that anti-realism about a domain follows from an anti-realist semantics based on proof conditions rather than truth conditions. His massive Frege scholarship and his debate with Realism dominated Anglo-American philosophy of language for decades.',
  },
  {
    slug: 'david-lewis',
    name: 'David Lewis',
    bornYear: 1941,
    bornCertainty: 'exact',
    diedYear: 2001,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Metaphysician who defended modal realism — the thesis that all possible worlds are equally real, concrete, and spatiotemporally isolated from one another. On the Plurality of Worlds is the systematic statement; his shorter papers on causation, mind, and semantics are among the most technically accomplished in analytic philosophy.',
  },
  {
    slug: 'dm-armstrong',
    name: 'D. M. Armstrong',
    alsoKnownAs: 'David Malet Armstrong',
    bornYear: 1926,
    bornCertainty: 'exact',
    diedYear: 2014,
    diedCertainty: 'exact',
    nationality: 'Australian',
    bioShort: 'Australian metaphysician and leading defender of a naturalist ontology of universals and states of affairs. Universals and Scientific Realism and A World of States of Affairs are the major works. His correspondence theory of truth and views on laws of nature were highly influential.',
  },

  // ── Ethics & Political Philosophy ─────────────────────────────────────────────
  {
    slug: 'gem-anscombe',
    name: 'G. E. M. Anscombe',
    alsoKnownAs: 'Elizabeth Anscombe',
    bornYear: 1919,
    bornCertainty: 'exact',
    diedYear: 2001,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Wittgenstein\'s student and literary executor. Intention (1957) founded the philosophy of action; "Modern Moral Philosophy" (1958) coined the term "consequentialism," criticized Kantian ethics, and called for a return to Aristotelian virtue ethics. A committed Catholic philosopher.',
  },
  {
    slug: 'philippa-foot',
    name: 'Philippa Foot',
    bornYear: 1920,
    bornCertainty: 'exact',
    diedYear: 2010,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Moral philosopher who revived Aristotelian virtue ethics against Humean expressivism and Kantian formalism. Natural Goodness (2001) grounds ethics in a naturalistic account of what is good for living things of a given kind. Invented the trolley problem in a 1967 paper.',
  },
  {
    slug: 'bernard-williams',
    name: 'Bernard Williams',
    bornYear: 1929,
    bornCertainty: 'exact',
    diedYear: 2003,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Philosopher who subjected moral theory — especially utilitarianism and Kantian ethics — to sustained critique. Ethics and the Limits of Philosophy argues that moral philosophy cannot provide a systematic theory of how to live; Shame and Necessity recovers Greek moral psychology.',
  },
  {
    slug: 'john-rawls',
    name: 'John Rawls',
    bornYear: 1921,
    bornCertainty: 'exact',
    diedYear: 2002,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'The most important political philosopher of the twentieth century. A Theory of Justice (1971) revived social contract theory against utilitarianism, using the "veil of ignorance" to derive principles of justice as fairness. Political Liberalism later reframed this as a political rather than a comprehensive doctrine.',
  },
  {
    slug: 'robert-nozick',
    name: 'Robert Nozick',
    bornYear: 1938,
    bornCertainty: 'exact',
    diedYear: 2002,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Libertarian political philosopher whose Anarchy, State, and Utopia (1974) argued that any state more extensive than a minimal nightwatchman state violates individual rights. Written as an explicit response to Rawls, it remains the most sophisticated defense of libertarianism.',
  },
  {
    slug: 'alasdair-macintyre',
    name: 'Alasdair MacIntyre',
    bornYear: 1929,
    bornCertainty: 'exact',
    nationality: 'Scottish',
    bioShort: 'Moral philosopher whose After Virtue (1981) diagnosed the fragmentation of modern moral discourse and proposed a return to Aristotelian virtue ethics embedded in living traditions. A convert to Thomism, he developed this position through Whose Justice? Which Rationality? and Three Rival Versions.',
  },
  {
    slug: 'martha-nussbaum',
    name: 'Martha Nussbaum',
    bornYear: 1947,
    bornCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher who developed the capabilities approach to justice and human development alongside Amartya Sen. The Fragility of Goodness recovers Aristotle on luck and ethics; Upheavals of Thought is a major study of the cognitive role of emotions. Writes on classical literature, cosmopolitanism, and the law.',
  },
  {
    slug: 'peter-singer',
    name: 'Peter Singer',
    bornYear: 1946,
    bornCertainty: 'exact',
    nationality: 'Australian',
    bioShort: 'Utilitarian moral philosopher whose Animal Liberation (1975) founded the modern animal rights movement by arguing that species membership is morally arbitrary. Practical Ethics applies utilitarian reasoning to global poverty, infanticide, and euthanasia. One of the most publicly influential living philosophers.',
  },
  {
    slug: 'charles-taylor',
    name: 'Charles Taylor',
    bornYear: 1931,
    bornCertainty: 'exact',
    nationality: 'Canadian',
    bioShort: 'Philosopher whose Sources of the Self traced the modern identity\'s constitutive moral frameworks; The Ethics of Authenticity critiques the culture of self-fulfillment; A Secular Age is a monumental account of how the West moved from enchanted to secular conditions. A communitarian critic of Rawlsian liberalism.',
  },
  {
    slug: 'john-searle',
    name: 'John Searle',
    bornYear: 1932,
    bornCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher of mind and language. Developed speech act theory beyond Austin; the Chinese Room argument challenged computational functionalism; Intentionality and The Construction of Social Reality address the mind\'s directedness and the ontology of social institutions.',
  },

  // ── Philosophy of Science ─────────────────────────────────────────────────────
  {
    slug: 'karl-popper',
    name: 'Karl Popper',
    bornYear: 1902,
    bornCertainty: 'exact',
    diedYear: 1994,
    diedCertainty: 'exact',
    nationality: 'Austrian',
    bioShort: 'Philosopher of science who replaced the verificationist criterion of meaning with falsifiability: a theory is scientific if it can in principle be refuted by observation. The Logic of Scientific Discovery and Conjectures and Refutations are the key texts. The Open Society and Its Enemies attacks Plato, Hegel, and Marx as totalitarian thinkers.',
  },
  {
    slug: 'thomas-kuhn',
    name: 'Thomas Kuhn',
    bornYear: 1922,
    bornCertainty: 'exact',
    diedYear: 1996,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Historian and philosopher of science whose Structure of Scientific Revolutions (1962) introduced "paradigm," "normal science," and "scientific revolution" into the culture. His arguments for incommensurability between paradigms triggered decades of debate about rationality and relativism.',
  },

  // ── Pittsburgh Neo-Hegelians ──────────────────────────────────────────────────
  {
    slug: 'sellars',
    name: 'Wilfrid Sellars',
    bornYear: 1912,
    bornCertainty: 'exact',
    diedYear: 1989,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Analytic philosopher whose attack on the Myth of the Given and vision of the "space of reasons" laid the groundwork for the Pittsburgh neo-Hegelian program. "Empiricism and the Philosophy of Mind" (1956) is the pivotal text.',
  },
  {
    slug: 'richard-rorty',
    name: 'Richard Rorty',
    bornYear: 1931,
    bornCertainty: 'exact',
    diedYear: 2007,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosophy and the Mirror of Nature (1979) attacked the foundations of analytic epistemology and proposed a neo-pragmatist alternative. Later developed a liberal irony combining solidarity with the contingency of all vocabularies. Aimed to heal the rift between the analytic and continental traditions.',
  },
  {
    slug: 'brandom',
    name: 'Robert Brandom',
    bornYear: 1950,
    bornCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher of language and inferentialist. Making It Explicit (1994) develops Sellars\'s and Hegel\'s normative pragmatics into a systematic theory of conceptual content grounded in social practices of giving and asking for reasons.',
  },
  {
    slug: 'mcdowell',
    name: 'John McDowell',
    bornYear: 1942,
    bornCertainty: 'exact',
    nationality: 'South African',
    bioShort: 'Philosopher who draws on Hegel, Aristotle, Wittgenstein, and Evans to argue that conceptual content is unbounded — perception itself is already conceptually shaped. Mind and World (1994) is the central text.',
  },

  // ── Contemporary Analytic ─────────────────────────────────────────────────────
  {
    slug: 'derek-parfit',
    name: 'Derek Parfit',
    bornYear: 1942,
    bornCertainty: 'exact',
    diedYear: 2017,
    diedCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Moral philosopher who argued that personal identity over time is not what matters and that population ethics is a serious problem for any moral theory. Reasons and Persons (1984) and the posthumous On What Matters are among the most ambitious works in recent moral philosophy.',
  },
  {
    slug: 'thomas-nagel',
    name: 'Thomas Nagel',
    bornYear: 1937,
    bornCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher known for "What Is It Like to Be a Bat?" (1974) — arguing that subjective experience cannot be captured by objective physical description — and The View from Nowhere, which explores the tension between the personal and impersonal standpoints.',
  },
  {
    slug: 'daniel-dennett',
    name: 'Daniel Dennett',
    bornYear: 1942,
    bornCertainty: 'exact',
    diedYear: 2024,
    diedCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher of mind and cognitive science who defended heterophenomenology and a deflationary account of consciousness. Consciousness Explained (1991) and Darwin\'s Dangerous Idea argued for a thoroughly naturalist picture of mind and meaning.',
  },
  {
    slug: 'david-chalmers',
    name: 'David Chalmers',
    bornYear: 1966,
    bornCertainty: 'exact',
    nationality: 'Australian',
    bioShort: 'Philosopher of mind who coined the "hard problem of consciousness" — why any physical process should give rise to subjective experience at all. The Conscious Mind (1996) defends a form of property dualism; his recent work turns to virtual reality and extended mind.',
  },
  {
    slug: 'tyler-burge',
    name: 'Tyler Burge',
    bornYear: 1946,
    bornCertainty: 'exact',
    nationality: 'American',
    bioShort: 'Philosopher of mind and language who developed anti-individualism (social externalism): the contents of mental states are not determined by what is in the head but by the social and physical environment. "Individualism and the Mental" is the locus classicus.',
  },
  {
    slug: 'timothy-williamson',
    name: 'Timothy Williamson',
    bornYear: 1955,
    bornCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Philosopher known for Knowledge and Its Limits (2000), which argues that knowledge — not justified true belief — is the fundamental epistemic concept, and for a sustained defense of modal logic and metaphysics against anti-metaphysical tendencies in analytic philosophy.',
  },
  {
    slug: 'frank-jackson',
    name: 'Frank Jackson',
    bornYear: 1943,
    bornCertainty: 'exact',
    nationality: 'Australian',
    bioShort: 'Philosopher of mind whose "Mary\'s Room" thought experiment — Mary knows all physical facts about color perception but learns something new on seeing red for the first time — poses the knowledge argument against physicalism. Later recanted toward physicalism in From Metaphysics to Ethics.',
  },
  {
    slug: 'kit-fine',
    name: 'Kit Fine',
    bornYear: 1946,
    bornCertainty: 'exact',
    nationality: 'British',
    bioShort: 'Philosopher of logic and metaphysics who rehabilitated the notion of essence as real definition — irreducible to modal properties — in "Essence and Modality" (1994). His work on ontological dependence, vagueness, and truthmakers has been widely influential.',
  },
];

// ── Philosopher ↔ School associations ────────────────────────────────────────

export const philosopherSchoolsData: PhilosopherSchoolSeed[] = [
  // Pre-Socratics
  { philosopherSlug: 'heraclitus',          schoolSlug: 'presocratic-philosophy', role: 'member' },
  { philosopherSlug: 'parmenides',          schoolSlug: 'presocratic-philosophy', role: 'member' },
  { philosopherSlug: 'democritus',          schoolSlug: 'presocratic-philosophy', role: 'member' },
  { philosopherSlug: 'zeno-of-citium',      schoolSlug: 'stoicism',               role: 'founder' },

  // Classical
  { philosopherSlug: 'socrates',            schoolSlug: 'platonism',              role: 'associated' },
  { philosopherSlug: 'plato',               schoolSlug: 'platonism',              role: 'founder' },
  { philosopherSlug: 'aristotle',           schoolSlug: 'aristotelianism',        role: 'founder' },
  { philosopherSlug: 'aristotle',           schoolSlug: 'platonism',              role: 'student' },
  { philosopherSlug: 'epicurus',            schoolSlug: 'epicureanism',           role: 'founder' },

  // Hellenistic
  { philosopherSlug: 'marcus-aurelius',     schoolSlug: 'stoicism',               role: 'member' },
  { philosopherSlug: 'plotinus',            schoolSlug: 'neoplatonism',           role: 'founder' },
  { philosopherSlug: 'plotinus',            schoolSlug: 'platonism',              role: 'associated' },

  // Medieval
  { philosopherSlug: 'augustine',           schoolSlug: 'scholasticism',          role: 'associated' },
  { philosopherSlug: 'augustine',           schoolSlug: 'neoplatonism',           role: 'associated' },
  { philosopherSlug: 'thomas-aquinas',      schoolSlug: 'scholasticism',          role: 'member' },
  { philosopherSlug: 'thomas-aquinas',      schoolSlug: 'aristotelianism',        role: 'associated' },
  { philosopherSlug: 'william-of-ockham',   schoolSlug: 'scholasticism',          role: 'member' },
  { philosopherSlug: 'john-buridan',        schoolSlug: 'scholasticism',          role: 'member' },

  // Early Modern
  { philosopherSlug: 'rene-descartes',      schoolSlug: 'rationalism',            role: 'founder' },
  { philosopherSlug: 'baruch-spinoza',      schoolSlug: 'rationalism',            role: 'member' },
  { philosopherSlug: 'gottfried-leibniz',   schoolSlug: 'rationalism',            role: 'member' },
  { philosopherSlug: 'john-locke',          schoolSlug: 'empiricism',             role: 'founder' },
  { philosopherSlug: 'george-berkeley',     schoolSlug: 'empiricism',             role: 'member' },
  { philosopherSlug: 'david-hume',          schoolSlug: 'empiricism',             role: 'member' },

  // Utilitarians
  { philosopherSlug: 'jeremy-bentham',      schoolSlug: 'utilitarianism',         role: 'founder' },
  { philosopherSlug: 'john-stuart-mill',    schoolSlug: 'utilitarianism',         role: 'member' },
  { philosopherSlug: 'peter-singer',        schoolSlug: 'utilitarianism',         role: 'member' },

  // German Idealism
  { philosopherSlug: 'immanuel-kant',       schoolSlug: 'german-idealism',        role: 'associated' },
  { philosopherSlug: 'fichte',              schoolSlug: 'german-idealism',        role: 'founder' },
  { philosopherSlug: 'schelling',           schoolSlug: 'german-idealism',        role: 'member' },
  { philosopherSlug: 'hegel',               schoolSlug: 'german-idealism',        role: 'member' },

  // Pragmatism
  { philosopherSlug: 'charles-peirce',      schoolSlug: 'pragmatism',             role: 'founder' },
  { philosopherSlug: 'william-james',       schoolSlug: 'pragmatism',             role: 'member' },
  { philosopherSlug: 'john-dewey',          schoolSlug: 'pragmatism',             role: 'member' },
  { philosopherSlug: 'george-herbert-mead', schoolSlug: 'pragmatism',             role: 'member' },
  { philosopherSlug: 'ci-lewis',            schoolSlug: 'pragmatism',             role: 'associated' },

  // Existentialism
  { philosopherSlug: 'kierkegaard',         schoolSlug: 'existentialism',         role: 'founder' },
  { philosopherSlug: 'nietzsche',           schoolSlug: 'existentialism',         role: 'associated' },
  { philosopherSlug: 'jean-paul-sartre',    schoolSlug: 'existentialism',         role: 'member' },
  { philosopherSlug: 'de-beauvoir',         schoolSlug: 'existentialism',         role: 'member' },
  { philosopherSlug: 'martin-heidegger',   schoolSlug: 'existentialism',         role: 'associated' },

  // Phenomenology
  { philosopherSlug: 'edmund-husserl',      schoolSlug: 'phenomenology',          role: 'founder' },
  { philosopherSlug: 'martin-heidegger',   schoolSlug: 'phenomenology',          role: 'member' },
  { philosopherSlug: 'jean-paul-sartre',    schoolSlug: 'phenomenology',          role: 'member' },
  { philosopherSlug: 'maurice-merleau-ponty', schoolSlug: 'phenomenology',        role: 'member' },
  { philosopherSlug: 'emmanuel-levinas',    schoolSlug: 'phenomenology',          role: 'member' },
  { philosopherSlug: 'paul-ricoeur',        schoolSlug: 'phenomenology',          role: 'associated' },

  // Hermeneutics
  { philosopherSlug: 'wilhelm-dilthey',     schoolSlug: 'hermeneutics',           role: 'founder' },
  { philosopherSlug: 'hans-georg-gadamer',  schoolSlug: 'hermeneutics',           role: 'member' },
  { philosopherSlug: 'paul-ricoeur',        schoolSlug: 'hermeneutics',           role: 'member' },
  { philosopherSlug: 'martin-heidegger',   schoolSlug: 'hermeneutics',           role: 'associated' },

  // Critical Theory / Frankfurt School
  { philosopherSlug: 'theodor-adorno',      schoolSlug: 'critical-theory',        role: 'founder' },
  { philosopherSlug: 'walter-benjamin',     schoolSlug: 'critical-theory',        role: 'associated' },
  { philosopherSlug: 'herbert-marcuse',     schoolSlug: 'critical-theory',        role: 'member' },
  { philosopherSlug: 'jurgen-habermas',     schoolSlug: 'critical-theory',        role: 'member' },

  // Analytic
  { philosopherSlug: 'gottlob-frege',       schoolSlug: 'analytic-philosophy',    role: 'founder' },
  { philosopherSlug: 'bertrand-russell',    schoolSlug: 'analytic-philosophy',    role: 'founder' },
  { philosopherSlug: 'ge-moore',            schoolSlug: 'analytic-philosophy',    role: 'founder' },
  { philosopherSlug: 'alfred-whitehead',    schoolSlug: 'analytic-philosophy',    role: 'associated' },
  { philosopherSlug: 'wittgenstein',        schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'wvo-quine',           schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'nelson-goodman',      schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'ruth-barcan-marcus',  schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'donald-davidson',     schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'saul-kripke',         schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'hilary-putnam',       schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'michael-dummett',     schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'david-lewis',         schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'dm-armstrong',        schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'sellars',             schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'brandom',             schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'mcdowell',            schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'derek-parfit',        schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'thomas-nagel',        schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'daniel-dennett',      schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'david-chalmers',      schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'tyler-burge',         schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'timothy-williamson',  schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'frank-jackson',       schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'kit-fine',            schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'gem-anscombe',        schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'philippa-foot',       schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'bernard-williams',    schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'john-rawls',          schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'robert-nozick',       schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'john-searle',         schoolSlug: 'analytic-philosophy',    role: 'member' },
  { philosopherSlug: 'karl-popper',         schoolSlug: 'analytic-philosophy',    role: 'associated' },

  // Logical Positivism
  { philosopherSlug: 'moritz-schlick',      schoolSlug: 'logical-positivism',     role: 'founder' },
  { philosopherSlug: 'rudolf-carnap',       schoolSlug: 'logical-positivism',     role: 'member' },
  { philosopherSlug: 'aj-ayer',             schoolSlug: 'logical-positivism',     role: 'member' },
  { philosopherSlug: 'wittgenstein',        schoolSlug: 'logical-positivism',     role: 'associated' },

  // Ordinary Language
  { philosopherSlug: 'gilbert-ryle',        schoolSlug: 'ordinary-language-philosophy', role: 'member' },
  { philosopherSlug: 'jl-austin',           schoolSlug: 'ordinary-language-philosophy', role: 'member' },
  { philosopherSlug: 'pf-strawson',         schoolSlug: 'ordinary-language-philosophy', role: 'member' },
  { philosopherSlug: 'hp-grice',            schoolSlug: 'ordinary-language-philosophy', role: 'member' },
  { philosopherSlug: 'wittgenstein',        schoolSlug: 'ordinary-language-philosophy', role: 'associated' },

  // Neo-Pragmatism
  { philosopherSlug: 'richard-rorty',       schoolSlug: 'neo-pragmatism',         role: 'founder' },
  { philosopherSlug: 'brandom',             schoolSlug: 'neo-pragmatism',         role: 'founder' },
  { philosopherSlug: 'mcdowell',            schoolSlug: 'neo-pragmatism',         role: 'member' },
];

// ── Influence relationships ───────────────────────────────────────────────────

export const philosopherInfluencesData: InfluenceSeed[] = [
  // Pre-Socratic chains
  { influencerSlug: 'heraclitus',        influencedSlug: 'plato',              influenceType: 'direct',   description: 'Plato absorbed Heraclitean flux for the sensible world, assigning stability only to the Forms.' },
  { influencerSlug: 'parmenides',        influencedSlug: 'plato',              influenceType: 'direct',   description: 'Plato\'s Parmenides dialogue engages the Eleatic challenge directly; the Forms echo Parmenidean Being.' },
  { influencerSlug: 'democritus',        influencedSlug: 'epicurus',           influenceType: 'direct',   description: 'Epicurus adopted and modified Democritus\'s atomism, adding the clinamen (swerve) to account for free will.' },

  // Ancient chains
  { influencerSlug: 'socrates',          influencedSlug: 'plato',              influenceType: 'direct' },
  { influencerSlug: 'plato',             influencedSlug: 'aristotle',          influenceType: 'direct' },
  { influencerSlug: 'aristotle',         influencedSlug: 'plato',              influenceType: 'critical', description: 'Aristotle rejected the theory of separated Forms.' },
  { influencerSlug: 'plato',             influencedSlug: 'plotinus',           influenceType: 'revival',  description: 'Plotinus reads Plato as teaching the hierarchy of the One, Intellect, and Soul.' },

  // Neoplatonism into Christianity
  { influencerSlug: 'plotinus',          influencedSlug: 'augustine',          influenceType: 'direct',   description: 'Augustine read the Neoplatonists before his conversion; their metaphysics of the One shaped his theology of God.' },
  { influencerSlug: 'plato',             influencedSlug: 'augustine',          influenceType: 'indirect' },

  // Medieval
  { influencerSlug: 'aristotle',         influencedSlug: 'thomas-aquinas',     influenceType: 'direct',   description: 'Aquinas\'s Thomism is an explicit synthesis of Aristotle\'s metaphysics, physics, and ethics with Christian theology.' },
  { influencerSlug: 'augustine',         influencedSlug: 'thomas-aquinas',     influenceType: 'direct' },
  { influencerSlug: 'thomas-aquinas',    influencedSlug: 'william-of-ockham',  influenceType: 'critical', description: 'Ockham\'s nominalism is a direct challenge to Thomistic realism about universals.' },
  { influencerSlug: 'william-of-ockham', influencedSlug: 'john-buridan',       influenceType: 'direct',   description: 'Buridan inherits Ockham\'s nominalism and extends his work on supposition theory and the logic of consequences.' },
  { influencerSlug: 'aristotle',         influencedSlug: 'john-buridan',       influenceType: 'direct',   description: 'Buridan\'s modal syllogistic is the most consolidated medieval reading of Aristotle\'s Prior Analytics I.8–22.' },

  // Early Modern empiricism chain
  { influencerSlug: 'john-locke',        influencedSlug: 'george-berkeley',    influenceType: 'direct',   description: 'Berkeley radicalizes Locke\'s empiricism by eliminating material substance entirely.' },
  { influencerSlug: 'john-locke',        influencedSlug: 'david-hume',         influenceType: 'direct' },
  { influencerSlug: 'george-berkeley',   influencedSlug: 'david-hume',         influenceType: 'direct' },

  // Early Modern rationalism chain
  { influencerSlug: 'rene-descartes',    influencedSlug: 'baruch-spinoza',     influenceType: 'direct',   description: 'Spinoza adopts Descartes\'s geometric method and substance metaphysics, then transforms both.' },
  { influencerSlug: 'rene-descartes',    influencedSlug: 'gottfried-leibniz',  influenceType: 'direct' },

  // Into Kant
  { influencerSlug: 'david-hume',        influencedSlug: 'immanuel-kant',      influenceType: 'direct',   description: 'Hume "awoke Kant from his dogmatic slumber."' },
  { influencerSlug: 'jean-jacques-rousseau', influencedSlug: 'immanuel-kant',  influenceType: 'direct',   description: 'Rousseau\'s moral philosophy, especially the general will and respect for persons, shaped Kant\'s ethics.' },

  // Kant into German Idealism
  { influencerSlug: 'immanuel-kant',     influencedSlug: 'fichte',             influenceType: 'direct' },
  { influencerSlug: 'immanuel-kant',     influencedSlug: 'schelling',          influenceType: 'direct' },
  { influencerSlug: 'immanuel-kant',     influencedSlug: 'hegel',              influenceType: 'direct',   description: 'Hegel takes the Kantian critical project and argues that the thing-in-itself is an incoherent residue to be dissolved in the Absolute.' },
  { influencerSlug: 'fichte',            influencedSlug: 'hegel',              influenceType: 'direct',   description: 'Fichte\'s self-positing I and dialectical method are immediate forerunners of Hegel\'s dialectic.' },
  { influencerSlug: 'schelling',         influencedSlug: 'hegel',              influenceType: 'direct',   description: 'Schelling\'s identity-philosophy is the immediate stimulus the Phenomenology responds to and surpasses.' },

  // Kant into 19th C
  { influencerSlug: 'immanuel-kant',     influencedSlug: 'arthur-schopenhauer', influenceType: 'direct',  description: 'Schopenhauer accepts the Kantian distinction between phenomena and things-in-themselves, identifying the latter with Will.' },
  { influencerSlug: 'immanuel-kant',     influencedSlug: 'john-rawls',         influenceType: 'direct',   description: 'Rawls construes his theory as a Kantian account of justice, grounding it in rational autonomy and the categorical imperative.' },

  // Out of Hegel
  { influencerSlug: 'hegel',             influencedSlug: 'kierkegaard',        influenceType: 'critical', description: 'Kierkegaard\'s entire project protests the System: it swallows the individual into the universal and leaves no room for the leap of faith.' },
  { influencerSlug: 'hegel',             influencedSlug: 'marx',               influenceType: 'direct',   description: 'Marx inverted Hegel\'s idealist dialectic — the movement of history is driven by material forces, not Spirit.' },
  { influencerSlug: 'hegel',             influencedSlug: 'nietzsche',          influenceType: 'critical', description: 'Nietzsche rejected Hegel\'s teleological view of history.' },
  { influencerSlug: 'hegel',             influencedSlug: 'de-beauvoir',        influenceType: 'direct' },
  { influencerSlug: 'hegel',             influencedSlug: 'sellars',            influenceType: 'indirect', description: 'Sellars\'s attack on the Myth of the Given recapitulates Hegel\'s critique of sense-certainty.' },
  { influencerSlug: 'hegel',             influencedSlug: 'brandom',            influenceType: 'indirect', description: 'Brandom explicitly draws on Hegel\'s Phenomenology for his model of recognition and social normativity.' },
  { influencerSlug: 'hegel',             influencedSlug: 'mcdowell',           influenceType: 'indirect', description: 'McDowell invokes Hegel\'s "second nature" to resolve the tension between freedom and nature.' },
  { influencerSlug: 'hegel',             influencedSlug: 'hans-georg-gadamer', influenceType: 'indirect', description: 'Gadamer\'s historicism and dialectical model of interpretation inherit Hegelian themes.' },
  { influencerSlug: 'hegel',             influencedSlug: 'theodor-adorno',     influenceType: 'direct',   description: 'Negative Dialectics is in sustained polemic with Hegel\'s principle of identity.' },
  { influencerSlug: 'hegel',             influencedSlug: 'jurgen-habermas',    influenceType: 'indirect' },

  // Marx into Frankfurt School
  { influencerSlug: 'marx',              influencedSlug: 'theodor-adorno',     influenceType: 'direct' },
  { influencerSlug: 'marx',              influencedSlug: 'walter-benjamin',    influenceType: 'direct' },
  { influencerSlug: 'marx',              influencedSlug: 'herbert-marcuse',    influenceType: 'direct' },
  { influencerSlug: 'marx',              influencedSlug: 'jurgen-habermas',    influenceType: 'indirect' },

  // Nietzsche
  { influencerSlug: 'arthur-schopenhauer', influencedSlug: 'nietzsche',        influenceType: 'direct',   description: 'Nietzsche began as a Schopenhauerian; the will to power is a revision of the Will to Live.' },
  { influencerSlug: 'nietzsche',         influencedSlug: 'martin-heidegger',  influenceType: 'direct',   description: 'Heidegger read Nietzsche as the culmination and exhaustion of Western metaphysics.' },
  { influencerSlug: 'nietzsche',         influencedSlug: 'michel-foucault',   influenceType: 'direct',   description: 'Foucault\'s genealogical method is explicitly derived from Nietzsche\'s Genealogy of Morality.' },
  { influencerSlug: 'nietzsche',         influencedSlug: 'gilles-deleuze',    influenceType: 'direct',   description: 'Deleuze\'s Nietzsche and Philosophy (1962) is one of the most influential interpretations and shapes his own philosophy of difference.' },
  { influencerSlug: 'nietzsche',         influencedSlug: 'de-beauvoir',       influenceType: 'direct' },

  // Brentano → Husserl → Phenomenology chain
  { influencerSlug: 'franz-brentano',    influencedSlug: 'edmund-husserl',    influenceType: 'direct',   description: 'Brentano\'s concept of intentionality is the starting point for Husserl\'s phenomenology.' },
  { influencerSlug: 'edmund-husserl',    influencedSlug: 'martin-heidegger',  influenceType: 'direct',   description: 'Heidegger was Husserl\'s assistant; Being and Time transforms phenomenological method into fundamental ontology.' },
  { influencerSlug: 'edmund-husserl',    influencedSlug: 'jean-paul-sartre',  influenceType: 'direct',   description: 'Sartre encountered Husserl\'s phenomenology in Berlin and it became the method of Being and Nothingness.' },
  { influencerSlug: 'edmund-husserl',    influencedSlug: 'maurice-merleau-ponty', influenceType: 'direct' },
  { influencerSlug: 'edmund-husserl',    influencedSlug: 'emmanuel-levinas',  influenceType: 'direct',   description: 'Levinas translated Husserl into French and wrote the first French dissertation on his phenomenology.' },
  { influencerSlug: 'martin-heidegger',  influencedSlug: 'hans-georg-gadamer', influenceType: 'direct',  description: 'Gadamer was Heidegger\'s student; Truth and Method extends Heideggerian hermeneutics.' },
  { influencerSlug: 'martin-heidegger',  influencedSlug: 'jean-paul-sartre',  influenceType: 'direct' },
  { influencerSlug: 'martin-heidegger',  influencedSlug: 'jacques-derrida',   influenceType: 'direct',   description: 'Derrida\'s deconstruction is developed largely through a critical reading of Heidegger on language, presence, and metaphysics.' },
  { influencerSlug: 'martin-heidegger',  influencedSlug: 'paul-ricoeur',      influenceType: 'direct' },
  { influencerSlug: 'hans-georg-gadamer', influencedSlug: 'paul-ricoeur',     influenceType: 'direct' },
  { influencerSlug: 'wilhelm-dilthey',   influencedSlug: 'hans-georg-gadamer', influenceType: 'direct',  description: 'Gadamer engages Dilthey\'s hermeneutics throughout Truth and Method, both inheriting and criticizing it.' },

  // Analytic chains
  { influencerSlug: 'gottlob-frege',     influencedSlug: 'bertrand-russell',  influenceType: 'direct',   description: 'Russell read Frege\'s Grundgesetze and adopted logicism; Russell\'s paradox then undermined Frege\'s system.' },
  { influencerSlug: 'gottlob-frege',     influencedSlug: 'wittgenstein',      influenceType: 'direct',   description: 'Wittgenstein went to Cambridge specifically to work with Russell after reading Frege.' },
  { influencerSlug: 'gottlob-frege',     influencedSlug: 'rudolf-carnap',     influenceType: 'direct',   description: 'Carnap attended Frege\'s lectures and his logical syntax program develops Fregean logic.' },
  { influencerSlug: 'gottlob-frege',     influencedSlug: 'michael-dummett',   influenceType: 'direct',   description: 'Dummett\'s major scholarly project was interpreting and extending Frege\'s philosophy of language.' },
  { influencerSlug: 'bertrand-russell',  influencedSlug: 'wittgenstein',      influenceType: 'direct',   description: 'Russell supervised Wittgenstein at Cambridge; the Tractatus develops Russell\'s logical atomism.' },
  { influencerSlug: 'bertrand-russell',  influencedSlug: 'ge-moore',          influenceType: 'direct' },
  { influencerSlug: 'bertrand-russell',  influencedSlug: 'alfred-whitehead',  influenceType: 'direct' },
  { influencerSlug: 'wittgenstein',      influencedSlug: 'moritz-schlick',    influenceType: 'direct',   description: 'The Vienna Circle read the Tractatus as supporting their verificationism.' },
  { influencerSlug: 'wittgenstein',      influencedSlug: 'rudolf-carnap',     influenceType: 'direct' },
  { influencerSlug: 'wittgenstein',      influencedSlug: 'gilbert-ryle',      influenceType: 'indirect' },
  { influencerSlug: 'wittgenstein',      influencedSlug: 'pf-strawson',       influenceType: 'indirect' },
  { influencerSlug: 'wittgenstein',      influencedSlug: 'gem-anscombe',      influenceType: 'direct',   description: 'Anscombe was Wittgenstein\'s student and literary executor; Intention is a Wittgensteinian work.' },
  { influencerSlug: 'wittgenstein',      influencedSlug: 'saul-kripke',       influenceType: 'direct',   description: 'Kripke on Rules and Private Language is an interpretation of — and landmark intervention in — the rule-following sections of the Investigations.' },
  { influencerSlug: 'rudolf-carnap',     influencedSlug: 'wvo-quine',         influenceType: 'critical', description: '"Two Dogmas of Empiricism" is addressed principally at Carnap\'s analytic-synthetic distinction.' },
  { influencerSlug: 'moritz-schlick',    influencedSlug: 'aj-ayer',           influenceType: 'direct',   description: 'Ayer visited the Vienna Circle and brought logical positivism to a British audience.' },
  { influencerSlug: 'wvo-quine',         influencedSlug: 'donald-davidson',   influenceType: 'direct',   description: 'Davidson was Quine\'s student; he inherits naturalism and transforms it with a truth-theoretic semantics.' },
  { influencerSlug: 'wvo-quine',         influencedSlug: 'nelson-goodman',    influenceType: 'direct',   description: 'Quine and Goodman were close colleagues; their joint paper on nominalism is a landmark.' },
  { influencerSlug: 'wvo-quine',         influencedSlug: 'hilary-putnam',     influenceType: 'direct' },
  { influencerSlug: 'donald-davidson',   influencedSlug: 'richard-rorty',     influenceType: 'direct',   description: 'Rorty draws heavily on Davidson\'s critique of the scheme-content dualism in his neo-pragmatism.' },
  { influencerSlug: 'ruth-barcan-marcus', influencedSlug: 'saul-kripke',      influenceType: 'direct',   description: 'Barcan Marcus\'s quantified modal logic and direct reference anticipate the core of Naming and Necessity.' },
  { influencerSlug: 'saul-kripke',       influencedSlug: 'hilary-putnam',     influenceType: 'direct',   description: 'Kripke\'s rigid designators directly influenced Putnam\'s Twin Earth and natural kind terms.' },

  // Pragmatism chain
  { influencerSlug: 'charles-peirce',    influencedSlug: 'william-james',     influenceType: 'direct',   description: 'James acknowledged Peirce as the founder of pragmatism and popularized the movement.' },
  { influencerSlug: 'william-james',     influencedSlug: 'john-dewey',        influenceType: 'direct' },
  { influencerSlug: 'john-dewey',        influencedSlug: 'george-herbert-mead', influenceType: 'direct' },
  { influencerSlug: 'charles-peirce',    influencedSlug: 'ci-lewis',          influenceType: 'indirect' },

  // Sellars chain into neo-pragmatism
  { influencerSlug: 'sellars',           influencedSlug: 'brandom',           influenceType: 'direct',   description: 'Brandom\'s inferentialism directly develops Sellars\'s distinction between the space of reasons and the space of causes.' },
  { influencerSlug: 'sellars',           influencedSlug: 'mcdowell',          influenceType: 'direct',   description: 'McDowell\'s Mind and World is in sustained dialogue with Sellars\'s "Empiricism and the Philosophy of Mind."' },
  { influencerSlug: 'sellars',           influencedSlug: 'richard-rorty',     influenceType: 'direct',   description: 'Rorty was Sellars\'s student; Philosophy and the Mirror of Nature develops Sellarsian themes.' },
  { influencerSlug: 'richard-rorty',     influencedSlug: 'brandom',           influenceType: 'direct',   description: 'Brandom was Rorty\'s student at Princeton.' },

  // Utilitarianism chain
  { influencerSlug: 'jeremy-bentham',    influencedSlug: 'john-stuart-mill',  influenceType: 'direct',   description: 'Mill was educated as a Benthamite but revised utilitarianism to distinguish quality of pleasures.' },
  { influencerSlug: 'john-stuart-mill',  influencedSlug: 'peter-singer',      influenceType: 'indirect' },

  // Ethics
  { influencerSlug: 'aristotle',         influencedSlug: 'gem-anscombe',      influenceType: 'revival',  description: '"Modern Moral Philosophy" called for return to Aristotelian virtue ethics.' },
  { influencerSlug: 'aristotle',         influencedSlug: 'philippa-foot',     influenceType: 'revival',  description: 'Natural Goodness grounds ethics in Aristotelian natural teleology.' },
  { influencerSlug: 'aristotle',         influencedSlug: 'alasdair-macintyre', influenceType: 'revival',  description: 'After Virtue diagnoses modernity\'s loss of the Aristotelian teleological framework.' },
  { influencerSlug: 'aristotle',         influencedSlug: 'martha-nussbaum',   influenceType: 'revival' },
  { influencerSlug: 'gem-anscombe',      influencedSlug: 'philippa-foot',     influenceType: 'direct' },
  { influencerSlug: 'john-rawls',        influencedSlug: 'robert-nozick',     influenceType: 'critical', description: 'Anarchy, State, and Utopia is written as an explicit libertarian response to A Theory of Justice.' },
  { influencerSlug: 'john-rawls',        influencedSlug: 'bernard-williams',  influenceType: 'critical', description: 'Williams critiques Rawlsian moral theory for its detachment from actual human motivations.' },
  { influencerSlug: 'john-rawls',        influencedSlug: 'derek-parfit',      influenceType: 'direct' },

  // Philosophy of mind contemporary
  { influencerSlug: 'thomas-nagel',      influencedSlug: 'david-chalmers',    influenceType: 'direct',   description: 'Nagel\'s "What Is It Like to Be a Bat?" directly anticipates Chalmers\'s hard problem.' },
  { influencerSlug: 'jl-austin',         influencedSlug: 'john-searle',       influenceType: 'direct',   description: 'Searle was Austin\'s student; Speech Acts develops Austinian speech act theory systematically.' },
  { influencerSlug: 'pf-strawson',       influencedSlug: 'saul-kripke',       influenceType: 'direct' },
];

// ── Works ─────────────────────────────────────────────────────────────────────

export const worksData: WorkSeed[] = [
  // Pre-Socratics
  { slug: 'on-nature-parmenides', title: 'On Nature', originalTitle: 'Περὶ φύσεως', philosopherSlug: 'parmenides', workType: 'poem', composedYear: -480, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'Surviving in fragments, this philosophical poem in two parts presents the Way of Truth (Being is one, unchanging, indivisible) and the Way of Seeming (a cosmology offered as merely plausible).' },
  { slug: 'fragments-heraclitus', title: 'Fragments', philosopherSlug: 'heraclitus', workType: 'fragment', composedYear: -500, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'Around 125 fragments survive, cited by later authors. They articulate the doctrine of universal flux, the unity of opposites, and the Logos as the rational principle governing all change.' },

  // Plato
  { slug: 'republic', title: 'Republic', originalTitle: 'Πολιτεία', philosopherSlug: 'plato', workType: 'dialogue', composedYear: -380, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'Plato\'s central work on justice, the ideal city-state, the philosopher-king, and the theory of Forms. Contains the allegory of the cave.' },
  { slug: 'phaedo', title: 'Phaedo', originalTitle: 'Φαίδων', philosopherSlug: 'plato', workType: 'dialogue', composedYear: -385, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'The dialogue set on the day of Socrates\'s death. Argues for the immortality of the soul through the Theory of Recollection and the Theory of Forms.' },
  { slug: 'symposium', title: 'Symposium', originalTitle: 'Συμπόσιον', philosopherSlug: 'plato', workType: 'dialogue', composedYear: -385, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'A series of speeches on the nature of Eros (love), culminating in Socrates\'s account of the Ladder of Beauty and Diotima\'s teaching on the Form of Beauty.' },

  // Aristotle
  { slug: 'nicomachean-ethics', title: 'Nicomachean Ethics', originalTitle: 'Ἠθικὰ Νικομάχεια', philosopherSlug: 'aristotle', workType: 'treatise', composedYear: -350, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'Aristotle\'s systematic account of the good life, virtue, practical wisdom (phronesis), and eudaimonia (flourishing).' },
  { slug: 'metaphysics', title: 'Metaphysics', originalTitle: 'Τὰ μετὰ τὰ φυσικά', philosopherSlug: 'aristotle', workType: 'treatise', composedYear: -350, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'Aristotle\'s investigation of Being qua Being — substance, form, matter, actuality, and potentiality. Book XII on the Unmoved Mover is the theological culmination.' },
  { slug: 'organon', title: 'Organon', originalTitle: 'Ὄργανον', philosopherSlug: 'aristotle', workType: 'collection', composedYear: -350, composedCertainty: 'circa', originalLanguage: 'Ancient Greek', descriptionShort: 'The collection of Aristotle\'s logical works: Categories, On Interpretation, Prior Analytics, Posterior Analytics, Topics, and Sophistical Refutations. Dominated logic until Frege.' },

  // Marcus Aurelius
  { slug: 'meditations', title: 'Meditations', originalTitle: 'Τὰ εἰς ἑαυτόν', philosopherSlug: 'marcus-aurelius', workType: 'other', composedYear: 161, composedYearEnd: 180, composedCertainty: 'range', originalLanguage: 'Ancient Greek', descriptionShort: 'A private journal never intended for publication. Reflections on Stoic practice, duty, impermanence, and the philosopher\'s inner discipline.' },

  // Plotinus
  { slug: 'enneads', title: 'Enneads', originalTitle: 'Ἐννεάδες', philosopherSlug: 'plotinus', workType: 'collection', composedYear: 253, composedYearEnd: 270, composedCertainty: 'range', originalLanguage: 'Ancient Greek', descriptionShort: 'Fifty-four treatises organized by Porphyry into six groups of nine. Develops the Neoplatonic system: the One, Intellect (Nous), Soul, and their emanation and return.' },

  // Augustine
  { slug: 'confessions', title: 'Confessions', originalTitle: 'Confessiones', philosopherSlug: 'augustine', workType: 'other', composedYear: 397, composedCertainty: 'circa', originalLanguage: 'Latin', descriptionShort: 'Philosophical autobiography and prayer addressed to God. The first of its kind in Western literature. Narrates Augustine\'s intellectual journey through Manichaeism and Neoplatonism to Christianity, and contains deep meditations on time, memory, and the will.' },
  { slug: 'city-of-god', title: 'City of God', originalTitle: 'De Civitate Dei', philosopherSlug: 'augustine', workType: 'treatise', composedYear: 413, composedYearEnd: 426, composedCertainty: 'range', originalLanguage: 'Latin', descriptionShort: 'Written after the sack of Rome (410), argues that the earthly city and the city of God are intermingled in history but distinct in destiny. Shaped Western Christian political theology.' },

  // Aquinas
  { slug: 'summa-theologiae', title: 'Summa Theologiae', philosopherSlug: 'thomas-aquinas', workType: 'treatise', composedYear: 1265, composedYearEnd: 1274, composedCertainty: 'range', originalLanguage: 'Latin', descriptionShort: 'The masterwork of Scholastic theology. Organized as objections and replies, it covers God\'s existence and nature, creation, virtue, law, and the sacraments. Contains the Five Ways (proofs for God\'s existence).' },

  // Ockham
  { slug: 'summa-logicae', title: 'Summa Logicae', philosopherSlug: 'william-of-ockham', workType: 'treatise', composedYear: 1323, composedCertainty: 'circa', originalLanguage: 'Latin', descriptionShort: 'A comprehensive treatment of logic from a nominalist standpoint. Argues that universals are mental concepts (not real entities) and that terms have meaning through their function in propositions, not through metaphysical correspondence.' },

  // Bacon
  { slug: 'novum-organum', title: 'Novum Organum', philosopherSlug: 'francis-bacon', workType: 'treatise', composedYear: 1620, composedCertainty: 'exact', originalLanguage: 'Latin', descriptionShort: 'Proposes a new inductive method for natural philosophy, replacing Aristotelian syllogistic. Introduces the "idols" (of the tribe, cave, marketplace, and theater) as sources of intellectual error to be cleared away.' },

  // Hobbes
  { slug: 'leviathan', title: 'Leviathan', philosopherSlug: 'thomas-hobbes', workType: 'treatise', composedYear: 1651, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Hobbes\'s masterpiece of political philosophy. In the state of nature life is "solitary, poor, nasty, brutish, and short"; rational agents contract to surrender natural freedom to a sovereign in exchange for peace and security.' },

  // Spinoza
  { slug: 'ethics', title: 'Ethics', originalTitle: 'Ethica Ordine Geometrico Demonstrata', philosopherSlug: 'baruch-spinoza', workType: 'treatise', composedYear: 1677, composedCertainty: 'exact', originalLanguage: 'Latin', descriptionShort: 'Written in geometric form (definitions, axioms, propositions, proofs). Argues that God and Nature are one infinite substance (Deus sive Natura); minds and bodies are two attributes of this one substance; human freedom consists in understanding necessity.' },

  // Locke
  { slug: 'essay-concerning-human-understanding', title: 'An Essay Concerning Human Understanding', philosopherSlug: 'john-locke', workType: 'treatise', composedYear: 1689, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that the mind at birth is a blank slate (tabula rasa) and that all knowledge derives from experience. Develops the distinction between primary and secondary qualities and a theory of personal identity.' },
  { slug: 'two-treatises-of-government', title: 'Two Treatises of Government', philosopherSlug: 'john-locke', workType: 'treatise', composedYear: 1689, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The Second Treatise grounds legitimate government in consent and the protection of natural rights to life, liberty, and property. Directly influenced the American founders.' },

  // Leibniz
  { slug: 'monadology', title: 'Monadology', originalTitle: 'La Monadologie', philosopherSlug: 'gottfried-leibniz', workType: 'treatise', composedYear: 1714, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'Ninety paragraphs presenting Leibniz\'s mature metaphysics: reality consists of monads (simple, windowless, mind-like substances), their pre-established harmony, and God as the best of all possible worlds.' },

  // Berkeley
  { slug: 'principles-of-human-knowledge', title: 'A Treatise Concerning the Principles of Human Knowledge', philosopherSlug: 'george-berkeley', workType: 'treatise', composedYear: 1710, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The systematic statement of Berkeley\'s immaterialism: material substance is unintelligible; to be is to be perceived (esse est percipi); God perceives all things at all times.' },

  // Descartes
  { slug: 'meditations-on-first-philosophy', title: 'Meditations on First Philosophy', originalTitle: 'Meditationes de Prima Philosophia', philosopherSlug: 'rene-descartes', workType: 'treatise', composedYear: 1641, composedCertainty: 'exact', originalLanguage: 'Latin', descriptionShort: 'Six meditations establishing the cogito, arguing for mind-body dualism, and attempting to ground knowledge on indubitable foundations.' },

  // Rousseau
  { slug: 'social-contract', title: 'The Social Contract', originalTitle: 'Du Contrat Social', philosopherSlug: 'jean-jacques-rousseau', workType: 'treatise', composedYear: 1762, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: '"Man is born free, and everywhere he is in chains." Argues that legitimate political authority rests on a social contract expressing the general will, not on tradition or divine right.' },
  { slug: 'discourse-on-inequality', title: 'Discourse on the Origin of Inequality', originalTitle: 'Discours sur l\'origine de l\'inégalité', philosopherSlug: 'jean-jacques-rousseau', workType: 'essay', composedYear: 1755, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'Distinguishes natural inequality (physical differences) from moral inequality (property, law, power) and argues the latter is a contingent product of civilization, not of nature.' },

  // Hume
  { slug: 'enquiry-concerning-human-understanding', title: 'An Enquiry Concerning Human Understanding', philosopherSlug: 'david-hume', workType: 'treatise', composedYear: 1748, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Hume\'s accessible revision of the Treatise. Presents the copy principle, the problem of induction, skepticism about causation, and the argument against miracles.' },
  { slug: 'treatise-of-human-nature', title: 'A Treatise of Human Nature', philosopherSlug: 'david-hume', workType: 'treatise', composedYear: 1739, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Hume\'s first and most systematic work, "fallen dead-born from the press." Books I (Understanding) and II (Passions) develop his associationist psychology; Book III (Morals) argues that moral judgments express sentiments, not reason.' },

  // Kant
  { slug: 'critique-of-pure-reason', title: 'Critique of Pure Reason', originalTitle: 'Kritik der reinen Vernunft', philosopherSlug: 'immanuel-kant', workType: 'treatise', composedYear: 1781, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Kant\'s first Critique. Argues that space, time, and the categories of understanding are imposed by the mind on experience — the Copernican Revolution in philosophy.' },
  { slug: 'groundwork-of-the-metaphysics-of-morals', title: 'Groundwork of the Metaphysics of Morals', originalTitle: 'Grundlegung zur Metaphysik der Sitten', philosopherSlug: 'immanuel-kant', workType: 'treatise', composedYear: 1785, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Kant\'s foundational work in moral philosophy. Articulates the categorical imperative and grounds morality in pure practical reason rather than consequences or inclination.' },
  { slug: 'critique-of-judgment', title: 'Critique of the Power of Judgment', originalTitle: 'Kritik der Urteilskraft', philosopherSlug: 'immanuel-kant', workType: 'treatise', composedYear: 1790, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Kant\'s third Critique, on aesthetic and teleological judgment. The Analytic of the Beautiful grounds aesthetic experience in a free play of imagination and understanding; the section on the sublime is also widely discussed.' },

  // Bentham
  { slug: 'introduction-to-principles-of-morals', title: 'Introduction to the Principles of Morals and Legislation', philosopherSlug: 'jeremy-bentham', workType: 'treatise', composedYear: 1789, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The founding text of utilitarianism: "Nature has placed mankind under the governance of two sovereign masters, pain and pleasure." Develops the felicific calculus for measuring utility.' },

  // Mill
  { slug: 'utilitarianism', title: 'Utilitarianism', philosopherSlug: 'john-stuart-mill', workType: 'essay', composedYear: 1863, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Refines Bentham\'s utilitarianism by distinguishing qualities of pleasure ("better to be Socrates dissatisfied than a fool satisfied") and grounding the greatest happiness principle in a proof from the psychology of desire.' },
  { slug: 'on-liberty', title: 'On Liberty', philosopherSlug: 'john-stuart-mill', workType: 'treatise', composedYear: 1859, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues for the harm principle: the only legitimate reason to restrict individual liberty is to prevent harm to others. A foundational text of political liberalism.' },

  // Schopenhauer
  { slug: 'world-as-will-and-representation', title: 'The World as Will and Representation', originalTitle: 'Die Welt als Wille und Vorstellung', philosopherSlug: 'arthur-schopenhauer', workType: 'treatise', composedYear: 1818, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Schopenhauer\'s magnum opus: the phenomenal world is representation; the thing-in-itself is Will — a blind, striving force. Salvation lies in aesthetic contemplation and ascetic denial of the will-to-live. Directly influenced Nietzsche, Wagner, and Freud.' },

  // Brentano
  { slug: 'psychology-from-empirical-standpoint', title: 'Psychology from an Empirical Standpoint', originalTitle: 'Psychologie vom empirischen Standpunkt', philosopherSlug: 'franz-brentano', workType: 'treatise', composedYear: 1874, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Revives the Scholastic concept of intentionality as the mark of the mental: every mental act is directed at an object. The starting point for Husserl\'s phenomenology and much subsequent philosophy of mind.' },

  // Peirce
  { slug: 'how-to-make-our-ideas-clear', title: 'How to Make Our Ideas Clear', philosopherSlug: 'charles-peirce', workType: 'essay', composedYear: 1878, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The classic statement of the pragmatic maxim: the meaning of a concept lies in its conceivable practical effects. "Consider what effects, that might conceivably have practical bearings, we conceive the object of our conception to have."' },

  // James
  { slug: 'pragmatism-james', title: 'Pragmatism: A New Name for Some Old Ways of Thinking', philosopherSlug: 'william-james', workType: 'collection', composedYear: 1907, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Eight lectures that brought pragmatism to a general audience. Argues that ideas are true insofar as they help us get into satisfactory relations with other parts of our experience — a thesis that drew fierce criticism from Russell and Moore.' },
  { slug: 'principles-of-psychology', title: 'The Principles of Psychology', philosopherSlug: 'william-james', workType: 'treatise', composedYear: 1890, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The founding text of scientific psychology in America. Introduces the stream of consciousness, habit, emotion (the James–Lange theory), and the self. Written with extraordinary literary verve.' },

  // Dewey
  { slug: 'experience-and-nature', title: 'Experience and Nature', philosopherSlug: 'john-dewey', workType: 'treatise', composedYear: 1925, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Dewey\'s metaphysics of experience: experience is not a veil separating us from nature but is continuous with it. The work argues for a naturalist account of mind, language, and value.' },
  { slug: 'logic-theory-of-inquiry', title: 'Logic: The Theory of Inquiry', philosopherSlug: 'john-dewey', workType: 'treatise', composedYear: 1938, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The fullest statement of Dewey\'s instrumentalism about logic: inquiry is a controlled transformation of an indeterminate situation into a determinate one; logic is the theory of the methods that govern this process.' },

  // Mead
  { slug: 'mind-self-and-society', title: 'Mind, Self, and Society', philosopherSlug: 'george-herbert-mead', workType: 'collection', composedYear: 1934, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Compiled from student notes after Mead\'s death. Argues that mind and self emerge from social interaction and the use of significant symbols; the "I" and the "me" are both aspects of a self constituted through taking the attitude of the other.' },

  // CI Lewis
  { slug: 'mind-and-the-world-order', title: 'Mind and the World Order', philosopherSlug: 'ci-lewis', workType: 'treatise', composedYear: 1929, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Develops conceptualistic pragmatism: the a priori consists of pragmatically adopted conceptual frameworks applied to the given in experience. The given is real but valueless without interpretation; interpretation is always revisable.' },

  // Frege
  { slug: 'begriffsschrift', title: 'Begriffsschrift', philosopherSlug: 'gottlob-frege', workType: 'treatise', composedYear: 1879, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Invented modern quantificational logic, introducing the universal quantifier, function-argument notation, and a complete formal system for logic. The single most important advance in logic since Aristotle.' },
  { slug: 'foundations-of-arithmetic', title: 'The Foundations of Arithmetic', originalTitle: 'Die Grundlagen der Arithmetik', philosopherSlug: 'gottlob-frege', workType: 'treatise', composedYear: 1884, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Argues that numbers are logical objects — extensions of concepts — and that arithmetic is reducible to logic. Contains the context principle and the critique of psychologism.' },
  { slug: 'on-sense-and-reference', title: 'On Sense and Reference', originalTitle: 'Über Sinn und Bedeutung', philosopherSlug: 'gottlob-frege', workType: 'essay', composedYear: 1892, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Distinguishes the sense (Sinn) of an expression — its mode of presentation — from its reference (Bedeutung) — the object it picks out. "Hesperus is Phosphorus" is informative because the names have different senses but the same reference (Venus).' },

  // Russell
  { slug: 'problems-of-philosophy', title: 'The Problems of Philosophy', philosopherSlug: 'bertrand-russell', workType: 'treatise', composedYear: 1912, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'A clear and accessible introduction to Russell\'s realist empiricism. Argues for a distinction between knowledge by acquaintance and knowledge by description, and defends the existence of universals.' },
  { slug: 'on-denoting', title: 'On Denoting', philosopherSlug: 'bertrand-russell', workType: 'essay', composedYear: 1905, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Russell\'s theory of descriptions: "The present King of France is bald" is not about a nonexistent entity but is a false existential claim. Called by Russell "a paradigm of philosophy" — solving apparent puzzles about reference through logical analysis.' },

  // Moore
  { slug: 'principia-ethica', title: 'Principia Ethica', philosopherSlug: 'ge-moore', workType: 'treatise', composedYear: 1903, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that "good" is a simple, indefinable, non-natural property and that defining it in terms of anything natural commits the "naturalistic fallacy." Proposes an intuitionist ethics and identifies beauty and friendship as the highest goods.' },

  // Whitehead
  { slug: 'process-and-reality', title: 'Process and Reality', philosopherSlug: 'alfred-whitehead', workType: 'treatise', composedYear: 1929, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Whitehead\'s mature metaphysics of process: the basic units of reality are "actual occasions" (events), not substances. Developed into the tradition of process theology.' },

  // Fichte
  { slug: 'wissenschaftslehre', title: 'Foundations of the Science of Knowledge', originalTitle: 'Grundlage der gesamten Wissenschaftslehre', philosopherSlug: 'fichte', workType: 'treatise', composedYear: 1794, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Fichte\'s attempt to ground Kant\'s critical philosophy in the self-positing activity of the I (Ich). The foundation of his Wissenschaftslehre and the immediate predecessor to Schelling and Hegel.' },

  // Schelling
  { slug: 'system-of-transcendental-idealism', title: 'System of Transcendental Idealism', originalTitle: 'System des transcendentalen Idealismus', philosopherSlug: 'schelling', workType: 'treatise', composedYear: 1800, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Traces the development of consciousness from nature to self-consciousness and presents art as the objective expression of the Absolute. Schelling\'s most widely read work.' },

  // Hegel
  { slug: 'phenomenology-of-spirit', title: 'Phenomenology of Spirit', originalTitle: 'Phänomenologie des Geistes', philosopherSlug: 'hegel', workType: 'treatise', composedYear: 1807, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Hegel\'s account of consciousness\'s journey toward Absolute Knowledge. Contains the master-slave dialectic, the unhappy consciousness, and the logic of Spirit unfolding through history and culture.' },
  { slug: 'science-of-logic', title: 'Science of Logic', originalTitle: 'Wissenschaft der Logik', philosopherSlug: 'hegel', workType: 'treatise', composedYear: 1812, composedYearEnd: 1816, composedCertainty: 'range', originalLanguage: 'German', descriptionShort: 'Hegel\'s systematic treatment of the pure categories of thought — Being, Essence, and Concept — as the self-movement of the Absolute Idea. The most demanding of his major works.' },
  { slug: 'encyclopedia-logic', title: 'Encyclopedia Logic', originalTitle: 'Enzyklopädie der philosophischen Wissenschaften, Teil I', philosopherSlug: 'hegel', workType: 'treatise', composedYear: 1817, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Part I of the Encyclopedia of Philosophical Sciences — the "Shorter Logic." A compressed presentation of the logical system. The most accessible entry into Hegel\'s logic.' },
  { slug: 'philosophy-of-right', title: 'Elements of the Philosophy of Right', originalTitle: 'Grundlinien der Philosophie des Rechts', philosopherSlug: 'hegel', workType: 'treatise', composedYear: 1820, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Hegel\'s social and political philosophy, covering abstract right, morality, and ethical life (Sittlichkeit) — family, civil society, and the state. The most politically contested of his works.' },
  { slug: 'lectures-on-history-of-philosophy', title: 'Lectures on the History of Philosophy', originalTitle: 'Vorlesungen über die Geschichte der Philosophie', philosopherSlug: 'hegel', workType: 'collection', composedYear: 1833, composedCertainty: 'circa', originalLanguage: 'German', descriptionShort: 'Posthumously compiled lectures tracing philosophy from the pre-Socratics to Kant and Hegel himself, as the progressive self-realization of Spirit.' },

  // Kierkegaard
  { slug: 'either-or', title: 'Either/Or', originalTitle: 'Enten-Eller', philosopherSlug: 'kierkegaard', workType: 'treatise', composedYear: 1843, composedCertainty: 'exact', originalLanguage: 'Danish', descriptionShort: 'Published pseudonymously as Victor Eremita. Contrasts the aesthetic and ethical stages of existence through the papers of two fictional authors.' },
  { slug: 'concluding-unscientific-postscript', title: 'Concluding Unscientific Postscript', originalTitle: 'Afsluttende uvidenskabelig Efterskrift', philosopherSlug: 'kierkegaard', workType: 'treatise', composedYear: 1846, composedCertainty: 'exact', originalLanguage: 'Danish', descriptionShort: 'Published as Johannes Climacus. The major statement of Kierkegaard\'s existential philosophy and sustained critique of Hegel. Introduces "subjectivity is truth."' },

  // Marx
  { slug: 'economic-philosophic-manuscripts', title: 'Economic and Philosophic Manuscripts of 1844', philosopherSlug: 'marx', workType: 'other', composedYear: 1844, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Unpublished notebooks developing Marx\'s early concepts of alienated labor, species-being, and the critical relationship between his materialism and Hegel\'s idealism.' },
  { slug: 'capital-vol-1', title: 'Capital, Volume I', originalTitle: 'Das Kapital, Band I', philosopherSlug: 'marx', workType: 'treatise', composedYear: 1867, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Marx\'s critique of political economy. Analyzes the commodity, labor-value, surplus-value, and capital accumulation — with an explicit methodological debt to Hegel\'s dialectical logic.' },

  // Nietzsche
  { slug: 'beyond-good-and-evil', title: 'Beyond Good and Evil', originalTitle: 'Jenseits von Gut und Böse', philosopherSlug: 'nietzsche', workType: 'treatise', composedYear: 1886, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Nietzsche\'s critique of past philosophers as unconscious advocates for their own prejudices. Develops the will to power and the notion of the philosopher of the future.' },
  { slug: 'genealogy-of-morality', title: 'On the Genealogy of Morality', originalTitle: 'Zur Genealogie der Moral', philosopherSlug: 'nietzsche', workType: 'treatise', composedYear: 1887, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Three essays tracing the historical origins of our moral concepts: the master-slave inversion, bad conscience, and the ascetic ideal. The model for Foucault\'s genealogical method.' },

  // Frege already done above; continue

  // Wittgenstein
  { slug: 'tractatus', title: 'Tractatus Logico-Philosophicus', originalTitle: 'Logisch-philosophische Abhandlung', philosopherSlug: 'wittgenstein', workType: 'treatise', composedYear: 1921, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Wittgenstein\'s early masterpiece. A numbered series of propositions arguing that language pictures facts and that what cannot be said must be passed over in silence.' },
  { slug: 'philosophical-investigations', title: 'Philosophical Investigations', originalTitle: 'Philosophische Untersuchungen', philosopherSlug: 'wittgenstein', workType: 'treatise', composedYear: 1953, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Published posthumously. Dismantles the picture theory of meaning via language games, family resemblance, and the private language argument.' },

  // Schlick
  { slug: 'general-theory-of-knowledge', title: 'General Theory of Knowledge', originalTitle: 'Allgemeine Erkenntnislehre', philosopherSlug: 'moritz-schlick', workType: 'treatise', composedYear: 1918, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Schlick\'s early epistemological work, combining a correspondence theory of truth with an analysis of the conditions of scientific knowledge. Later superseded by his verificationism.' },

  // Carnap
  { slug: 'logical-structure-of-the-world', title: 'The Logical Structure of the World', originalTitle: 'Der logische Aufbau der Welt', philosopherSlug: 'rudolf-carnap', workType: 'treatise', composedYear: 1928, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Attempts a rational reconstruction of all knowledge from elementary experiences using logical construction. The most ambitious statement of the positivist program.' },
  { slug: 'logical-syntax-of-language', title: 'The Logical Syntax of Language', originalTitle: 'Logische Syntax der Sprache', philosopherSlug: 'rudolf-carnap', workType: 'treatise', composedYear: 1934, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Develops the principle of tolerance: there are no morals in logic, only conventions. Philosophy\'s task is the logical analysis of the language of science.' },

  // Ayer
  { slug: 'language-truth-and-logic', title: 'Language, Truth and Logic', philosopherSlug: 'aj-ayer', workType: 'treatise', composedYear: 1936, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Written at 24, brought logical positivism to a British audience. The verification principle: a statement is cognitively meaningful only if it is analytic or empirically verifiable. Ethical statements express emotions, not truths.' },

  // Ryle
  { slug: 'concept-of-mind', title: 'The Concept of Mind', philosopherSlug: 'gilbert-ryle', workType: 'treatise', composedYear: 1949, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Attacks Cartesian dualism (the "ghost in the machine") as a category mistake. Mind-talk describes behavioral dispositions, not inner occurrences in a separate mental substance.' },

  // Austin
  { slug: 'how-to-do-things-with-words', title: 'How to Do Things with Words', philosopherSlug: 'jl-austin', workType: 'collection', composedYear: 1962, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Based on the 1955 William James Lectures. Distinguishes locutionary, illocutionary, and perlocutionary acts, and argues that utterances are performances as much as descriptions.' },

  // Strawson
  { slug: 'individuals', title: 'Individuals: An Essay in Descriptive Metaphysics', philosopherSlug: 'pf-strawson', workType: 'treatise', composedYear: 1959, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that material bodies and persons are the basic particulars in our conceptual scheme. Introduces the distinction between revisionary and descriptive metaphysics.' },
  { slug: 'freedom-and-resentment', title: 'Freedom and Resentment', philosopherSlug: 'pf-strawson', workType: 'essay', composedYear: 1962, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that the concept of moral responsibility is tied to the "reactive attitudes" (resentment, gratitude, indignation) that are constitutive of interpersonal relationships, not to metaphysical facts about determinism.' },

  // Grice
  { slug: 'logic-and-conversation', title: 'Logic and Conversation', philosopherSlug: 'hp-grice', workType: 'essay', composedYear: 1975, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Distinguishes what is said (semantic content) from what is implicated (conversational implicature) and articulates four maxims of cooperative conversation: Quantity, Quality, Relation, Manner.' },

  // Husserl
  { slug: 'logical-investigations', title: 'Logical Investigations', originalTitle: 'Logische Untersuchungen', philosopherSlug: 'edmund-husserl', workType: 'treatise', composedYear: 1900, composedYearEnd: 1901, composedCertainty: 'range', originalLanguage: 'German', descriptionShort: 'Husserl\'s anti-psychologistic critique of logic and the founding work of phenomenology. The Sixth Investigation on meaning-intention and meaning-fulfillment is especially influential.' },
  { slug: 'ideas-i', title: 'Ideas I', originalTitle: 'Ideen zu einer reinen Phänomenologie', philosopherSlug: 'edmund-husserl', workType: 'treatise', composedYear: 1913, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Introduces the phenomenological reduction (epoché) and the distinction between the natural attitude and pure consciousness. The most systematic statement of transcendental phenomenology.' },

  // Heidegger
  { slug: 'being-and-time', title: 'Being and Time', originalTitle: 'Sein und Zeit', philosopherSlug: 'martin-heidegger', workType: 'treatise', composedYear: 1927, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'The fundamental ontology of Dasein (human existence). Analyzes being-in-the-world, care, temporality, authenticity, and thrownness. The most influential continental philosophy work of the twentieth century.' },
  { slug: 'question-concerning-technology', title: 'The Question Concerning Technology', originalTitle: 'Die Frage nach der Technik', philosopherSlug: 'martin-heidegger', workType: 'essay', composedYear: 1954, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Argues that the essence of modern technology is Gestell (enframing) — a mode of revealing that reduces everything to standing-reserve (Bestand). Art offers an alternative mode of revealing.' },

  // Sartre
  { slug: 'being-and-nothingness', title: 'Being and Nothingness', originalTitle: 'L\'Être et le Néant', philosopherSlug: 'jean-paul-sartre', workType: 'treatise', composedYear: 1943, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'The systematic statement of Sartre\'s existentialism. Analyzes consciousness (being-for-itself), things (being-in-itself), and the look of the Other. Argues for radical freedom and the consequent anguish of responsibility.' },

  // Merleau-Ponty
  { slug: 'phenomenology-of-perception', title: 'Phenomenology of Perception', originalTitle: 'Phénoménologie de la perception', philosopherSlug: 'maurice-merleau-ponty', workType: 'treatise', composedYear: 1945, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'The foundational text in philosophy of embodiment. Argues that perception is not a mental act but an achievement of the whole body; the lived body (corps propre) is the primary subject of experience.' },

  // Levinas
  { slug: 'totality-and-infinity', title: 'Totality and Infinity', originalTitle: 'Totalité et Infini', philosopherSlug: 'emmanuel-levinas', workType: 'treatise', composedYear: 1961, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'Argues that ethics — the encounter with the Other\'s face — is first philosophy, prior to ontology. The face issues an infinite, asymmetrical demand: "Thou shalt not kill."' },

  // Arendt
  { slug: 'human-condition', title: 'The Human Condition', philosopherSlug: 'hannah-arendt', workType: 'treatise', composedYear: 1958, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Distinguishes three fundamental human activities: labor (biological necessity), work (fabrication of durable objects), and action (political activity in the public realm). Diagnoses modernity\'s eclipse of genuine political action.' },
  { slug: 'origins-of-totalitarianism', title: 'The Origins of Totalitarianism', philosopherSlug: 'hannah-arendt', workType: 'treatise', composedYear: 1951, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Traces the historical roots of Nazi and Stalinist totalitarianism through anti-Semitism and imperialism. Argues that totalitarianism is a genuinely novel form of domination, not merely tyranny.' },

  // Gadamer
  { slug: 'truth-and-method', title: 'Truth and Method', originalTitle: 'Wahrheit und Methode', philosopherSlug: 'hans-georg-gadamer', workType: 'treatise', composedYear: 1960, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'The foundational text of philosophical hermeneutics. Argues that understanding is always historically situated, mediated by tradition and language, irreducible to methodological control. The fusion of horizons is the model of interpretation.' },

  // Ricoeur
  { slug: 'oneself-as-another', title: 'Oneself as Another', originalTitle: 'Soi-même comme un autre', philosopherSlug: 'paul-ricoeur', workType: 'treatise', composedYear: 1990, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'A hermeneutics of personal identity that distinguishes idem-identity (sameness) from ipse-identity (selfhood). Argues that narrative and ethical commitment are constitutive of who a person is.' },

  // Foucault
  { slug: 'discipline-and-punish', title: 'Discipline and Punish', originalTitle: 'Surveiller et punir', philosopherSlug: 'michel-foucault', workType: 'treatise', composedYear: 1975, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'A genealogy of the modern prison and disciplinary power. Introduces the Panopticon as a model of a new form of power that operates through surveillance and normalization rather than spectacular punishment.' },
  { slug: 'order-of-things', title: 'The Order of Things', originalTitle: 'Les Mots et les Choses', philosopherSlug: 'michel-foucault', workType: 'treatise', composedYear: 1966, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'An archaeological analysis of the epistemes (historical structures of knowledge) governing the human sciences. Ends with the famous prediction that "man" — a recent invention — may soon be erased "like a face drawn in sand at the edge of the sea."' },

  // Derrida
  { slug: 'of-grammatology', title: 'Of Grammatology', originalTitle: 'De la grammatologie', philosopherSlug: 'jacques-derrida', workType: 'treatise', composedYear: 1967, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'Derrida\'s critique of "logocentrism" — the metaphysics of presence in Western philosophy from Plato to Saussure. Introduces différance and argues for the primacy of writing over speech.' },

  // Habermas
  { slug: 'theory-of-communicative-action', title: 'The Theory of Communicative Action', originalTitle: 'Theorie des kommunikativen Handelns', philosopherSlug: 'jurgen-habermas', workType: 'treatise', composedYear: 1981, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'A two-volume work grounding critical theory in an analysis of communicative rationality and the pragmatics of speech. Distinguishes communicative action (oriented to understanding) from strategic action (oriented to success).' },

  // Adorno
  { slug: 'dialectic-of-enlightenment', title: 'Dialectic of Enlightenment', originalTitle: 'Dialektik der Aufklärung', philosopherSlug: 'theodor-adorno', workType: 'treatise', composedYear: 1944, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Co-authored with Max Horkheimer. Argues that the Enlightenment\'s project of rational domination over nature turns into domination over human beings, culminating in fascism and the culture industry.' },
  { slug: 'negative-dialectics', title: 'Negative Dialectics', originalTitle: 'Negative Dialektik', philosopherSlug: 'theodor-adorno', workType: 'treatise', composedYear: 1966, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'A sustained polemic against identity thinking — the philosophical gesture that forces the non-identical into conceptual identity. Proposes a negative dialectics that preserves the non-conceptual remainder.' },

  // Benjamin
  { slug: 'illuminations', title: 'Illuminations', philosopherSlug: 'walter-benjamin', workType: 'collection', composedYear: 1955, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Posthumous collection including "The Work of Art in the Age of Mechanical Reproduction," "The Storyteller," and "Theses on the Philosophy of History." The essay on aura is the most discussed.' },

  // Marcuse
  { slug: 'one-dimensional-man', title: 'One-Dimensional Man', philosopherSlug: 'herbert-marcuse', workType: 'treatise', composedYear: 1964, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Diagnoses advanced industrial society\'s repression of genuine critical thought through the creation of false needs and the integration of opposition into the system. A major text of the New Left.' },

  // Deleuze
  { slug: 'difference-and-repetition', title: 'Difference and Repetition', originalTitle: 'Différence et répétition', philosopherSlug: 'gilles-deleuze', workType: 'treatise', composedYear: 1968, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'Deleuze\'s doctoral thesis and major philosophical work. Argues that difference is primary and identity derivative; repetition is not the same event recurring but a genuine production of novelty.' },

  // de Beauvoir
  { slug: 'the-second-sex', title: 'The Second Sex', originalTitle: 'Le Deuxième Sexe', philosopherSlug: 'de-beauvoir', workType: 'treatise', composedYear: 1949, composedCertainty: 'exact', originalLanguage: 'French', descriptionShort: 'Foundational work in feminist philosophy. Argues that woman is constructed as the Other relative to man, and examines how this shapes women\'s lived experience.' },

  // Quine
  { slug: 'two-dogmas-of-empiricism', title: 'Two Dogmas of Empiricism', philosopherSlug: 'wvo-quine', workType: 'essay', composedYear: 1951, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The most influential paper in postwar analytic philosophy. Demolishes the analytic-synthetic distinction and the reductionist verification theory, arguing for holism about meaning and the continuity of philosophy and science.' },
  { slug: 'word-and-object', title: 'Word and Object', philosopherSlug: 'wvo-quine', workType: 'treatise', composedYear: 1960, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Develops the indeterminacy of translation thesis through the "gavagai" thought experiment, argues for ontological relativity, and proposes a naturalized epistemology.' },

  // Goodman
  { slug: 'fact-fiction-and-forecast', title: 'Fact, Fiction, and Forecast', philosopherSlug: 'nelson-goodman', workType: 'treatise', composedYear: 1954, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Poses the "new riddle of induction" through the predicate "grue" (green up to a time, then blue), showing that merely enumerative accounts of induction fail and that entrenchment in practice distinguishes projectible predicates.' },
  { slug: 'ways-of-worldmaking', title: 'Ways of Worldmaking', philosopherSlug: 'nelson-goodman', workType: 'treatise', composedYear: 1978, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues for irrealism: there is no ready-made world; rather, there are multiple right world-versions constructed through different symbol systems. Art, science, and perception are equally valid modes of world-making.' },

  // Davidson
  { slug: 'essays-on-actions-and-events', title: 'Essays on Actions and Events', philosopherSlug: 'donald-davidson', workType: 'collection', composedYear: 1980, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Collected papers including "Actions, Reasons, and Causes" and "Mental Events" (anomalous monism). Argues that mental events are identical with physical events but mental descriptions are not reducible to physical ones.' },
  { slug: 'inquiries-into-truth-and-interpretation', title: 'Inquiries into Truth and Interpretation', philosopherSlug: 'donald-davidson', workType: 'collection', composedYear: 1984, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Collected papers including "Truth and Meaning," "Radical Interpretation," and "On the Very Idea of a Conceptual Scheme." Develops truth-conditional semantics and the principle of charity.' },

  // Kripke
  { slug: 'naming-and-necessity', title: 'Naming and Necessity', philosopherSlug: 'saul-kripke', workType: 'collection', composedYear: 1980, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Based on 1970 Princeton lectures. Argues for rigid designators, a posteriori necessity ("Water is H₂O"), and the causal theory of reference. Among the most influential philosophy books of the twentieth century.' },
  { slug: 'wittgenstein-on-rules', title: 'Wittgenstein on Rules and Private Language', philosopherSlug: 'saul-kripke', workType: 'treatise', composedYear: 1982, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'An interpretation of Wittgenstein\'s rule-following considerations as a skeptical paradox about meaning, and a "skeptical solution" in terms of communal assertability conditions.' },

  // Putnam
  { slug: 'reason-truth-and-history', title: 'Reason, Truth and History', philosopherSlug: 'hilary-putnam', workType: 'treatise', composedYear: 1981, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Introduces the "brain in a vat" thought experiment as a refutation of external realism and develops internal realism: truth is idealized rational acceptability from a human perspective.' },

  // Dummett
  { slug: 'frege-philosophy-of-language', title: 'Frege: Philosophy of Language', philosopherSlug: 'michael-dummett', workType: 'treatise', composedYear: 1973, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The most comprehensive treatment of Frege\'s philosophy of language in any language. Develops Dummett\'s own anti-realist semantics based on proof conditions alongside the scholarly reconstruction.' },

  // David Lewis
  { slug: 'on-the-plurality-of-worlds', title: 'On the Plurality of Worlds', philosopherSlug: 'david-lewis', workType: 'treatise', composedYear: 1986, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The systematic defense of modal realism: all possible worlds are equally real, concrete, and spatiotemporally isolated. Modality is explained by quantification over worlds; universals are replaced by set-theoretic constructs from possible individuals.' },
  { slug: 'counterfactuals', title: 'Counterfactuals', philosopherSlug: 'david-lewis', workType: 'treatise', composedYear: 1973, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Develops a possible-worlds semantics for counterfactual conditionals based on comparative similarity of worlds. The analysis is extended to causation in subsequent papers.' },

  // Armstrong
  { slug: 'universals-and-scientific-realism', title: 'Universals and Scientific Realism', philosopherSlug: 'dm-armstrong', workType: 'treatise', composedYear: 1978, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'A two-volume argument that universals (properties and relations) exist as immanent in their instances and that they are needed to ground laws of nature and the reliability of induction.' },

  // Sellars
  { slug: 'empiricism-and-the-philosophy-of-mind', title: 'Empiricism and the Philosophy of Mind', philosopherSlug: 'sellars', workType: 'essay', composedYear: 1956, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Sellars\'s pivotal essay demolishing the Myth of the Given — the idea that there can be epistemic episodes that are both causally efficacious and logically prior to all conceptual activity.' },

  // Rorty
  { slug: 'philosophy-and-the-mirror-of-nature', title: 'Philosophy and the Mirror of Nature', philosopherSlug: 'richard-rorty', workType: 'treatise', composedYear: 1979, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Attacks the Cartesian-Kantian project of epistemology-as-first-philosophy and argues for a hermeneutic, edifying conception of philosophy without foundations. A turning point in late-twentieth-century philosophy.' },
  { slug: 'contingency-irony-and-solidarity', title: 'Contingency, Irony, and Solidarity', philosopherSlug: 'richard-rorty', workType: 'treatise', composedYear: 1989, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that truth, selfhood, and community are all contingent; the liberal ironist holds her final vocabulary lightly while extending solidarity to those who suffer.' },

  // Brandom
  { slug: 'making-it-explicit', title: 'Making It Explicit', philosopherSlug: 'brandom', workType: 'treatise', composedYear: 1994, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Brandom\'s systematic inferentialist account of conceptual content, linguistic practice, and semantic normativity. Draws explicitly on Kant, Hegel, Frege, and Sellars.' },

  // McDowell
  { slug: 'mind-and-world', title: 'Mind and World', philosopherSlug: 'mcdowell', workType: 'collection', composedYear: 1994, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Based on the 1991 John Locke Lectures. Argues that the conceptual is unbounded: experience already has conceptual form, dissolving the oscillation between the Myth of the Given and coherentism.' },

  // Anscombe
  { slug: 'intention', title: 'Intention', philosopherSlug: 'gem-anscombe', workType: 'treatise', composedYear: 1957, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The founding text of the philosophy of action. Analyzes intentional action as action under a description; introduces the distinction between reasons and causes, anticipating Davidson\'s work.' },
  { slug: 'modern-moral-philosophy', title: 'Modern Moral Philosophy', philosopherSlug: 'gem-anscombe', workType: 'essay', composedYear: 1958, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Coins the term "consequentialism," argues that "moral obligation" without God is an empty concept, and calls for the abandonment of Kantian and utilitarian ethics in favor of an Aristotelian account of human flourishing.' },

  // Foot
  { slug: 'natural-goodness', title: 'Natural Goodness', philosopherSlug: 'philippa-foot', workType: 'treatise', composedYear: 2001, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Grounds ethics in a naturalistic account of what counts as good for living things of a given kind. What is good for a human is what is good for a human as the kind of thing it is — a rational, social, political animal.' },

  // Williams
  { slug: 'ethics-and-the-limits-of-philosophy', title: 'Ethics and the Limits of Philosophy', philosopherSlug: 'bernard-williams', workType: 'treatise', composedYear: 1985, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that moral philosophy — particularly its systematic varieties (utilitarianism, Kantian ethics) — cannot deliver what it promises: a theory of how to live. Ethics is thicker and more personal than theory allows.' },

  // Rawls
  { slug: 'theory-of-justice', title: 'A Theory of Justice', philosopherSlug: 'john-rawls', workType: 'treatise', composedYear: 1971, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Revives social contract theory via the "veil of ignorance" thought experiment to derive two principles of justice: equal basic liberties, and fair equality of opportunity with the difference principle.' },
  { slug: 'political-liberalism', title: 'Political Liberalism', philosopherSlug: 'john-rawls', workType: 'treatise', composedYear: 1993, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Reframes justice as fairness as a political rather than comprehensive doctrine, addressing how citizens holding conflicting but reasonable comprehensive views can nonetheless agree on principles of justice.' },

  // Nozick
  { slug: 'anarchy-state-and-utopia', title: 'Anarchy, State, and Utopia', philosopherSlug: 'robert-nozick', workType: 'treatise', composedYear: 1974, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'The most sophisticated defense of libertarianism in the analytic tradition. Argues that only a minimal state can be justified, and that redistribution violates individual rights.' },

  // MacIntyre
  { slug: 'after-virtue', title: 'After Virtue', philosopherSlug: 'alasdair-macintyre', workType: 'treatise', composedYear: 1981, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Diagnoses the fragmentation of modern moral discourse as the consequence of abandoning the Aristotelian teleological framework, and proposes a return to virtue ethics embedded in living traditions.' },

  // Nussbaum
  { slug: 'fragility-of-goodness', title: 'The Fragility of Goodness', philosopherSlug: 'martha-nussbaum', workType: 'treatise', composedYear: 1986, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'A philosophical reading of Greek tragedy and Plato on moral luck, vulnerability, and the relationship between ethics and literature. Argues that the good life is constitutively vulnerable.' },

  // Singer
  { slug: 'animal-liberation', title: 'Animal Liberation', philosopherSlug: 'peter-singer', workType: 'treatise', composedYear: 1975, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Founded the modern animal rights movement by arguing that the capacity to suffer, not species membership, is the morally relevant criterion. Speciesism is analogous to racism and sexism.' },
  { slug: 'practical-ethics', title: 'Practical Ethics', philosopherSlug: 'peter-singer', workType: 'treatise', composedYear: 1979, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Applies utilitarian reasoning to a range of practical issues: poverty and global aid, abortion, infanticide, euthanasia, and the environment. Highly influential and highly controversial.' },

  // Charles Taylor
  { slug: 'sources-of-the-self', title: 'Sources of the Self', philosopherSlug: 'charles-taylor', workType: 'treatise', composedYear: 1989, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'A historical and philosophical account of the modern identity. Argues that modern selfhood is constituted by moral frameworks (sources of the self) that are usually inarticulate and that secular humanism is not self-sufficient.' },

  // Searle
  { slug: 'speech-acts', title: 'Speech Acts', philosopherSlug: 'john-searle', workType: 'treatise', composedYear: 1969, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'A systematic development of Austin\'s speech act theory. Analyzes the distinction between regulative and constitutive rules, and the conditions for successful illocutionary acts.' },
  { slug: 'intentionality-searle', title: 'Intentionality', philosopherSlug: 'john-searle', workType: 'treatise', composedYear: 1983, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Applies speech act theory\'s insights to the philosophy of mind, arguing that intentional mental states have conditions of satisfaction analogous to speech acts, and that intentionality is a biological feature of the brain.' },

  // Popper
  { slug: 'logic-of-scientific-discovery', title: 'The Logic of Scientific Discovery', originalTitle: 'Logik der Forschung', philosopherSlug: 'karl-popper', workType: 'treatise', composedYear: 1934, composedCertainty: 'exact', originalLanguage: 'German', descriptionShort: 'Proposes falsifiability as the criterion of demarcation between science and non-science. Theories are scientific not because they can be verified but because they can in principle be refuted.' },
  { slug: 'open-society-and-its-enemies', title: 'The Open Society and Its Enemies', philosopherSlug: 'karl-popper', workType: 'treatise', composedYear: 1945, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'A sustained attack on the "historicist" philosophies of Plato, Hegel, and Marx as providing the intellectual foundations for totalitarianism. Defends liberal democracy and piecemeal social engineering.' },

  // Kuhn
  { slug: 'structure-of-scientific-revolutions', title: 'The Structure of Scientific Revolutions', philosopherSlug: 'thomas-kuhn', workType: 'treatise', composedYear: 1962, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that science progresses not by gradual accumulation but through paradigm shifts — revolutionary episodes where one incommensurable framework replaces another. Introduced "paradigm" and "normal science" into common use.' },

  // Parfit
  { slug: 'reasons-and-persons', title: 'Reasons and Persons', philosopherSlug: 'derek-parfit', workType: 'treatise', composedYear: 1984, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Part III argues that personal identity over time is not what matters; Part IV poses the "non-identity problem" and the "repugnant conclusion" as challenges to any moral theory about future people.' },

  // Nagel
  { slug: 'view-from-nowhere', title: 'The View from Nowhere', philosopherSlug: 'thomas-nagel', workType: 'treatise', composedYear: 1986, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that the objective-subjective tension — between the view from nowhere and the view from here — is irreducible and generates genuine philosophical problems about free will, knowledge, and ethics.' },
  { slug: 'what-is-it-like-to-be-a-bat', title: 'What Is It Like to Be a Bat?', philosopherSlug: 'thomas-nagel', workType: 'essay', composedYear: 1974, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that subjective experience — "what it is like" to be something — cannot be captured by objective physical description, posing a fundamental challenge to physicalist accounts of mind.' },

  // Dennett
  { slug: 'consciousness-explained', title: 'Consciousness Explained', philosopherSlug: 'daniel-dennett', workType: 'treatise', composedYear: 1991, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Defends a heterophenomenological, functionalist account of consciousness — the "multiple drafts" model — against both Cartesian theater views and mysterian positions. Highly controversial in both directions.' },

  // Chalmers
  { slug: 'conscious-mind', title: 'The Conscious Mind', philosopherSlug: 'david-chalmers', workType: 'treatise', composedYear: 1996, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues via the conceivability of zombies that consciousness cannot be explained in purely physical terms. Defends a form of naturalistic dualism: phenomenal properties are ontologically fundamental.' },

  // Williamson
  { slug: 'knowledge-and-its-limits', title: 'Knowledge and Its Limits', philosopherSlug: 'timothy-williamson', workType: 'treatise', composedYear: 2000, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that knowledge is a mental state (not merely a state of justified true belief), that knowledge is the norm of assertion, and that the margins for error in belief-formation explain the phenomena that motivate contextualism.' },

  // Jackson
  { slug: 'from-metaphysics-to-ethics', title: 'From Metaphysics to Ethics', philosopherSlug: 'frank-jackson', workType: 'treatise', composedYear: 1998, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues for the method of conceptual analysis and its indispensability to philosophy; shows how physicalism can vindicate common-sense psychology through the notion of realization.' },

  // Fine
  { slug: 'essence-and-modality', title: 'Essence and Modality', philosopherSlug: 'kit-fine', workType: 'essay', composedYear: 1994, composedCertainty: 'exact', originalLanguage: 'English', descriptionShort: 'Argues that essence — understood as real definition — is not reducible to modal properties: it is not essential to Socrates that he belongs to the singleton {Socrates}, even though this is necessary. Rehabilitated essentialism as a respectable metaphysical doctrine.' },
];

// ── Seed notes ────────────────────────────────────────────────────────────────
// A small set of notes loaded at seed time (sourceType: 'seed').
// API-fed notes are loaded separately via the notes API.

export const notesData: NoteSeed[] = [
  // General
  {
    philosopherSlug: 'socrates',
    noteType: 'quote',
    content: 'The unexamined life is not worth living.',
    sourceName: 'Plato, Apology 38a',
  },
  {
    philosopherSlug: 'aristotle',
    noteType: 'context',
    content: 'Aristotle wrote on an astonishing range of subjects — logic, biology, meteorology, rhetoric, poetics, ethics, politics. Many of his extant works are likely lecture notes rather than finished compositions.',
  },
  {
    workSlug: 'critique-of-pure-reason',
    noteType: 'context',
    content: 'Kant spent eleven years in relative silence before publishing the first Critique at 57. He then published the Groundwork (1785), Critique of Practical Reason (1788), and Critique of Judgment (1790) in rapid succession.',
  },

  // ── Hegel: reading order ──────────────────────────────────────────────────────
  {
    philosopherSlug: 'hegel',
    noteType: 'context',
    sourceName: 'Curator',
    content: `Reading Hegel: A Suggested Order

1. Start with secondary literature — Do not open Hegel cold. Begin with either Charles Taylor's Hegel (Cambridge, 1975) — comprehensive but demanding — or Frederick Beiser's Hegel (Routledge, 2005) for a crisper orientation. Both establish why Hegel thinks what he thinks before you encounter how he says it.

2. Encyclopedia Logic (the "Shorter Logic," 1817/1830) — Part I of the Encyclopedia of Philosophical Sciences. More compressed and accessible than the Science of Logic, this gives you the arc of Hegel's categorial progression from Being through Essence to the Concept without the full apparatus. Use the Geraets/Suchting/Harris translation.

3. Philosophy of Right (1820) — Hegel's political philosophy and theory of ethical life (Sittlichkeit). More concrete than the Logic; the sections on civil society and the state are the most influential and most politically contested parts of the corpus. A good place to see what Hegel's system delivers at a human scale.

4. Phenomenology of Spirit (1807) — Famous, formative, and genuinely difficult. The Master–Slave dialectic (§178–196) and the sections on Morality and Ethical Life in the chapter on Spirit (§§438–671) can be read as self-contained units before tackling the whole. Miller's translation; have Pinkard's or Inwood's commentary beside you.

5. Science of Logic (1812–1816) — The full systematic treatment of the categories of thought. Save for after you have a confident grip on the rest. Use di Giovanni's translation (Cambridge, 2010) — far superior to Johnston and Struthers. Read alongside Houlgate's The Opening of Hegel's Logic.`,
  },

  // ── Hegel: secondary literature ──────────────────────────────────────────────
  {
    philosopherSlug: 'hegel',
    noteType: 'bibliography',
    sourceName: 'Curator',
    content: `Essential Secondary Literature on Hegel

Introductions and overviews:
- Frederick Beiser, Hegel (Routledge, 2005) — the best short introduction; historically situated without being merely historical
- Charles Taylor, Hegel (Cambridge, 1975) — the standard comprehensive study; shaped an entire generation of English-language interpreters
- Terry Pinkard, Hegel: A Biography (Cambridge, 2000) — intellectual life narrated with unusual clarity; the author has made a PDF freely available

Systematic interpretations:
- Robert Pippin, Hegel's Idealism: The Satisfactions of Self-Consciousness (Cambridge, 1989) — argues Hegel is completing, not abandoning, Kant's epistemological project; essential for the Pittsburgh neo-Hegelian reading
- Stephen Houlgate, The Opening of Hegel's Logic (Purdue, 2006) — the best sustained treatment of the Science of Logic; especially strong on the beginning of the Logic and why Hegel starts with Being
- Michael Forster, Hegel's Idea of a Phenomenology of Spirit (Chicago, 1998) — careful structural analysis of the Phenomenology's method and organization

Influential and contested readings:
- Alexandre Kojève, Introduction to the Reading of Hegel (1947; English 1969) — enormously influential reading organized around desire and recognition; shaped Sartre, Lacan, Bataille, and postwar French thought. Inventive and fascinating, but often more Kojève than Hegel
- J. M. Bernstein, Recovering Ethical Life (Routledge, 1995) — on critique, ethical life, and the limits of Kantian morality; good on Hegel vs Habermas

Hegelian descendants worth reading alongside:
- Wilfrid Sellars, Empiricism and the Philosophy of Mind (1956) — the Hegelian move within analytic philosophy; the attack on the Myth of the Given recapitulates Hegel's critique of sense-certainty
- Robert Brandom, Making It Explicit (Harvard, 1994) — inherits Hegel's normative pragmatics and social account of conceptual content; the Pittsburgh inferentialist program made explicit
- John McDowell, Mind and World (Harvard, 1994) — uses Hegel's "second nature" to resolve the tension between the space of reasons and the space of causes`,
  },

  // ── Hegel: related thinkers ───────────────────────────────────────────────────
  {
    philosopherSlug: 'hegel',
    noteType: 'interpretation',
    sourceName: 'Curator',
    content: `Hegel's Philosophical Neighborhood

Immediate precursors:
Kant's Critique of Pure Reason (1781) is the inescapable starting point — Hegel sees himself as completing what Kant began but left split (subject/object, duty/inclination, form/content, finite/infinite). The thing-in-itself that Kant placed beyond knowledge is, for Hegel, an incoherent residue to be dissolved into the Absolute's self-knowing. Fichte's Wissenschaftslehre (1794) attempted to ground Kant's system in the self-positing activity of the I; Hegel finds this one-sided subjective idealism that cannot account for the objectivity of nature. Schelling's System of Transcendental Idealism (1800) and his philosophy of nature offer the other side — objective nature as unconscious spirit — which Hegel absorbs and surpasses by making Spirit the whole that contains both.

Critical reactions that defined existentialism:
Kierkegaard is the sharpest internal critic. His entire pseudonymous authorship is a protest against the System: Hegel absorbs the individual into the universal, history into necessity, and the moment of decision into dialectical aufhebung. What the System cannot accommodate is the existing individual who must choose in fear and trembling without rational guarantees. Marx performs the famous "inversion": the motor of history is not Spirit's self-recognition but material forces and relations of production. Hegel's dialectical method is retained; the idealist metaphysics is discarded (or in Marx's phrase, "turned right-side up").

Twentieth-century reception:
Husserl's phenomenology shares the project of describing the structure of consciousness but resists Hegel's teleological historicism. Heidegger reads Hegel as the culmination of Western metaphysics — its most complete expression of the forgetting of Being — and engages him throughout Being and Time and the later work. Gadamer's hermeneutics in Truth and Method (1960) inherits Hegel's historicism and the model of tradition as a living conversation. The Frankfurt School (Adorno, Horkheimer, Marcuse) develops Critical Theory as a Hegel–Marx synthesis, critical of both the System's reconciliation and naive Marxist optimism. Adorno's Negative Dialectics (1966) is in sustained polemic against Hegel's principle of identity.

Pittsburgh neo-Hegelians:
Wilfrid Sellars attacks the Myth of the Given in terms that parallel Hegel's critique of sense-certainty in the Phenomenology — the idea of immediate, theory-independent epistemic contact with the world is incoherent. Robert Brandom makes Hegel's expressive-inferentialist commitments explicit in the philosophy of language: conceptual content is constituted by inferential role and normative social practices of giving and asking for reasons. John McDowell returns to Hegel's notion of "second nature" (Bildung) to dissolve the oscillation between the Myth of the Given and a contentless coherentism — nature, properly understood, is already permeated by the conceptual.`,
  },
];
