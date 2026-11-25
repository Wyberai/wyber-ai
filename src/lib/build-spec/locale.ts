// One place that decides whether a brief is for India, so every pipeline picks rupees for the same reason.
// Live 23 Nov: a tuition teacher in Nashik got dollars because the old per-pipeline city list stopped at a dozen metros.

const CITIES = [
  'ahmedabad', 'surat', 'vadodara', 'baroda', 'rajkot', 'gandhinagar', 'bhavnagar', 'jamnagar', 'junagadh', 'bharuch', 'navsari', 'morbi', 'mehsana', 'bhuj', 'valsad', 'vapi',
  'mumbai', 'pune', 'nagpur', 'nashik', 'nasik', 'thane', 'aurangabad', 'kolhapur', 'solapur', 'navi mumbai', 'amravati', 'sangli', 'satara', 'latur', 'akola', 'jalgaon',
  'delhi', 'new delhi', 'noida', 'gurgaon', 'gurugram', 'faridabad', 'ghaziabad', 'chandigarh', 'ludhiana', 'amritsar', 'jalandhar', 'patiala', 'dehradun', 'haridwar', 'shimla',
  'jaipur', 'jodhpur', 'udaipur', 'ajmer', 'bikaner', 'alwar', 'bhilwara',
  'lucknow', 'kanpur', 'varanasi', 'agra', 'allahabad', 'prayagraj', 'meerut', 'bareilly', 'gorakhpur', 'aligarh', 'moradabad', 'mathura',
  'indore', 'bhopal', 'jabalpur', 'gwalior', 'ujjain', 'raipur', 'bilaspur', 'bhilai', 'ranchi', 'jamshedpur', 'dhanbad',
  'patna', 'muzaffarpur', 'bhagalpur', 'kolkata', 'howrah', 'siliguri', 'durgapur', 'bhubaneswar', 'cuttack', 'guwahati', 'imphal', 'shillong', 'agartala',
  'bengaluru', 'bangalore', 'mysuru', 'mysore', 'mangaluru', 'mangalore', 'hubli', 'belgaum', 'belagavi', 'bidar', 'gulbarga', 'kalaburagi', 'davangere',
  'hyderabad', 'secunderabad', 'warangal', 'vijayawada', 'visakhapatnam', 'vizag', 'guntur', 'tirupati', 'nellore',
  'chennai', 'coimbatore', 'madurai', 'tiruchirappalli', 'trichy', 'tirunelveli', 'erode', 'vellore',
  'kochi', 'cochin', 'thiruvananthapuram', 'trivandrum', 'kozhikode', 'calicut', 'thrissur', 'kannur', 'puducherry', 'pondicherry', 'panaji', 'goa',
]

const STATES = ['gujarat', 'maharashtra', 'rajasthan', 'punjab', 'haryana', 'uttar pradesh', 'madhya pradesh', 'bihar', 'jharkhand', 'odisha', 'west bengal', 'assam', 'karnataka', 'telangana', 'andhra pradesh', 'tamil nadu', 'kerala', 'uttarakhand', 'himachal', 'chhattisgarh']

const TERMS = ['india', 'inr', 'rupee', 'rupees', 'lakh', 'lakhs', 'crore', 'paise', 'gst', 'gstin', 'upi', 'udhaar', 'khata', 'kirana', 'tiffin', 'dhaba', 'mandi', 'pan card', 'aadhaar']

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const WORDS = new RegExp('\\b(' + [...CITIES, ...STATES, ...TERMS].map(escape).join('|') + ')\\b', 'i')

/** True when the brief names an Indian place, rupee wording, or a +91 number. */
export function isIndianPrompt(text: string): boolean {
  return /₹|\+91|\bRs\.?\s?\d/i.test(text) || WORDS.test(text)
}
