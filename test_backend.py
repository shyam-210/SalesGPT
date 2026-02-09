"""
SalesGPT - Comprehensive QA Test Suite
Tests bot behavior like a QA engineer with regression testing
"""

import requests
import json
import time
from typing import Dict, List
from datetime import datetime

BASE_URL = "http://localhost:8000"

class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'

class TestResult:
    def __init__(self, name: str, passed: bool, message: str = ""):
        self.name = name
        self.passed = passed
        self.message = message
        self.timestamp = datetime.now()

class SalesGPTTester:
    def __init__(self):
        self.results: List[TestResult] = []
        self.session_id = f"qa_test_{int(time.time())}"
        
    def log(self, message: str, color: str = Colors.BLUE):
        print(f"{color}{message}{Colors.END}")
    
    def log_success(self, message: str):
        self.log(f"✅ {message}", Colors.GREEN)
    
    def log_failure(self, message: str):
        self.log(f"❌ {message}", Colors.RED)
    
    def log_warning(self, message: str):
        self.log(f"⚠️  {message}", Colors.YELLOW)
    
    def chat(self, message: str, expect_keywords: List[str] = None) -> Dict:
        """Send a chat message and optionally validate keywords in response"""
        try:
            response = requests.post(
                f"{BASE_URL}/chat",
                json={
                    "message": message,
                    "session_id": self.session_id
                },
                timeout=30  # Increased from 10 to 30 seconds
            )
            
            if response.status_code == 200:
                data = response.json()
                bot_response = data['response']
                sources = data['sources']
                
                # Validate expected keywords
                if expect_keywords:
                    for keyword in expect_keywords:
                        if keyword.lower() not in bot_response.lower():
                            return {
                                "success": False,
                                "response": bot_response,
                                "sources": sources,
                                "error": f"Expected keyword '{keyword}' not found in response"
                            }
                
                return {
                    "success": True,
                    "response": bot_response,
                    "sources": sources
                }
            else:
                return {
                    "success": False,
                    "error": f"HTTP {response.status_code}: {response.text}"
                }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def get_lead_data(self) -> Dict:
        """Fetch lead data for current session"""
        try:
            response = requests.get(f"{BASE_URL}/leads", timeout=5)
            if response.status_code == 200:
                data = response.json()
                for lead in data['leads']:
                    if lead['session_id'] == self.session_id:
                        return lead
                return None
            return None
        except:
            return None
    
    def add_result(self, name: str, passed: bool, message: str = ""):
        """Record test result"""
        result = TestResult(name, passed, message)
        self.results.append(result)
        if passed:
            self.log_success(f"{name}: {message}")
        else:
            self.log_failure(f"{name}: {message}")
    
    # ============================================
    # Test Cases
    # ============================================
    
    def test_1_basic_greeting(self):
        """Test 1: Basic greeting response"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 1: Basic Greeting", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("hi")
        
        if result['success']:
            response = result['response']
            # Should greet back
            if any(word in response.lower() for word in ['hello', 'hi', 'welcome']):
                self.add_result("Greeting", True, "Bot greeted user appropriately")
            else:
                self.add_result("Greeting", False, f"No greeting found: {response}")
        else:
            self.add_result("Greeting", False, result['error'])
    
    def test_2_rag_pricing_query(self):
        """Test 2: RAG retrieval for pricing question"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 2: RAG Pricing Query", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("what are your pricing plans?")
        
        if result['success']:
            response = result['response']
            sources = result['sources']
            
            # Should mention pricing details
            has_pricing_info = any(word in response.lower() for word in ['pricing', 'plan', 'pay', 'cost', '$'])
            # Should use Pricing_Strategy_2026.md
            has_pricing_source = any('pricing' in s.lower() for s in sources)
            
            if has_pricing_info and has_pricing_source:
                self.add_result("RAG Pricing", True, f"Used {sources}")
            else:
                self.add_result("RAG Pricing", False, f"Missing pricing info or source")
        else:
            self.add_result("RAG Pricing", False, result['error'])
    
    def test_3_lead_collection_company(self):
        """Test 3: Bot asks for company when user shows interest"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 3: Lead Collection - Company", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("I'm interested in your enterprise plan")
        
        if result['success']:
            response = result['response']
            
            # Bot should ask for company
            asks_for_company = any(phrase in response.lower() for phrase in [
                'which company', 'what company', 'your company', 'company are you'
            ])
            
            if asks_for_company:
                self.add_result("Ask Company", True, "Bot asked for company name")
            else:
                self.add_result("Ask Company", False, f"Bot didn't ask for company: {response}")
        else:
            self.add_result("Ask Company", False, result['error'])
    
    def test_4_company_extraction(self):
        """Test 4: Provide company and verify extraction"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 4: Company Extraction", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("I'm from TechCorp AI")
        time.sleep(3)  # Wait for background task
        
        if result['success']:
            lead = self.get_lead_data()
            
            if lead and lead.get('company'):
                if 'techcorp' in lead['company'].lower():
                    self.add_result("Extract Company", True, f"Extracted: {lead['company']}")
                else:
                    self.add_result("Extract Company", False, f"Wrong company: {lead['company']}")
            else:
                self.add_result("Extract Company", False, "Company not extracted")
        else:
            self.add_result("Extract Company", False, result['error'])
    
    def test_5_lead_collection_email(self):
        """Test 5: Bot asks for email after company"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 5: Lead Collection - Email", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("we need cloud infrastructure for AI workloads")
        
        if result['success']:
            response = result['response']
            
            # Bot should ask for email
            asks_for_email = any(phrase in response.lower() for phrase in [
                'email', 'e-mail', 'contact', 'reach out'
            ])
            
            if asks_for_email:
                self.add_result("Ask Email", True, "Bot asked for email")
            else:
                self.add_result("Ask Email", False, f"Bot didn't ask for email: {response}")
        else:
            self.add_result("Ask Email", False, result['error'])
    
    def test_6_email_extraction(self):
        """Test 6: Provide email and verify extraction"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 6: Email Extraction", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("my email is john@techcorp.ai")
        time.sleep(3)  # Wait for background task
        
        if result['success']:
            response = result['response']
            lead = self.get_lead_data()
            
            # Bot should acknowledge email
            acknowledges_email = 'john@techcorp.ai' in response.lower()
            
            # Email should be extracted
            email_extracted = lead and lead.get('email') and 'john@techcorp.ai' in lead['email'].lower()
            
            if acknowledges_email and email_extracted:
                self.add_result("Extract Email", True, f"Extracted: {lead['email']}")
            elif not acknowledges_email:
                self.add_result("Extract Email", False, "Bot didn't acknowledge email")
            else:
                self.add_result("Extract Email", False, "Email not extracted to database")
        else:
            self.add_result("Extract Email", False, result['error'])
    
    def test_7_no_hallucination(self):
        """Test 7: Bot doesn't hallucinate when info not in knowledge base"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 7: No Hallucination", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("do you offer quantum computing services?")
        
        if result['success']:
            response = result['response']
            
            # Bot should either:
            # 1. Admit no info ("don't have", "not sure")
            # 2. Correctly say "we don't offer" (which is accurate)
            admits_no_info = any(phrase in response.lower() for phrase in [
                "don't have", "not have", "no information", "can't find", "not sure",
                "don't offer", "don't currently offer", "we don't"
            ])
            
            # Bot should NOT make up quantum computing features
            makes_up_features = any(phrase in response.lower() for phrase in [
                "quantum bits", "qubits", "quantum algorithms", "quantum advantage"
            ])
            
            if admits_no_info and not makes_up_features:
                self.add_result("No Hallucination", True, "Bot correctly handled unknown topic")
            elif makes_up_features:
                self.add_result("No Hallucination", False, f"Bot made up quantum features: {response}")
            else:
                self.add_result("No Hallucination", False, f"Bot didn't clearly address unknown topic: {response}")
        else:
            self.add_result("No Hallucination", False, result['error'])
    
    def test_8_no_email_sending_claim(self):
        """Test 8: Bot doesn't claim to send emails"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 8: No False Email Claims", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("can you send me the pricing details?")
        
        if result['success']:
            response = result['response']
            
            # Bot should NOT say "I've sent" or "I'll send"
            claims_to_send = any(phrase in response.lower() for phrase in [
                "i've sent", "i have sent", "i'll send", "i will send", "sent you"
            ])
            
            if not claims_to_send:
                self.add_result("No Email Claim", True, "Bot didn't falsely claim to send email")
            else:
                self.add_result("No Email Claim", False, f"Bot claimed to send email: {response}")
        else:
            self.add_result("No Email Claim", False, result['error'])
    
    def test_9_judge_scoring(self):
        """Test 9: Judge Agent scored the lead"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 9: Judge Agent Scoring", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        time.sleep(2)  # Wait for judge to finish
        lead = self.get_lead_data()
        
        if lead:
            score = lead.get('lead_score', 0)
            stage = lead.get('pipeline_status', 'Unknown')
            
            if score > 0:
                self.add_result("Judge Scoring", True, f"Score: {score}/100, Stage: {stage}")
            else:
                self.add_result("Judge Scoring", False, "Lead score is 0")
        else:
            self.add_result("Judge Scoring", False, "No lead data found")
    
    def test_10_conversation_memory(self):
        """Test 10: Bot remembers conversation context"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("TEST 10: Conversation Memory", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        result = self.chat("what was my company name again?")
        
        if result['success']:
            response = result['response']
            
            # Bot should mention TechCorp
            remembers_company = 'techcorp' in response.lower()
            
            if remembers_company:
                self.add_result("Conversation Memory", True, "Bot remembered company name")
            else:
                self.add_result("Conversation Memory", False, f"Bot forgot company: {response}")
        else:
            self.add_result("Conversation Memory", False, result['error'])
    
    # ============================================
    # Test Runner
    # ============================================
    
    def run_all_tests(self):
        """Run all test cases"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("🧪 SALESGPT QA TEST SUITE", Colors.BOLD)
        self.log(f"Session ID: {self.session_id}", Colors.BOLD)
        self.log("="*60 + "\n", Colors.BOLD)
        
        # Run tests in order
        self.test_1_basic_greeting()
        time.sleep(1)
        
        self.test_2_rag_pricing_query()
        time.sleep(1)
        
        self.test_3_lead_collection_company()
        time.sleep(1)
        
        self.test_4_company_extraction()
        time.sleep(1)
        
        self.test_5_lead_collection_email()
        time.sleep(1)
        
        self.test_6_email_extraction()
        time.sleep(1)
        
        self.test_7_no_hallucination()
        time.sleep(1)
        
        self.test_8_no_email_sending_claim()
        time.sleep(1)
        
        self.test_9_judge_scoring()
        time.sleep(1)
        
        self.test_10_conversation_memory()
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*60, Colors.BOLD)
        self.log("📊 TEST SUMMARY", Colors.BOLD)
        self.log("="*60, Colors.BOLD)
        
        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)
        total = len(self.results)
        
        self.log(f"\nTotal Tests: {total}")
        self.log_success(f"Passed: {passed}")
        if failed > 0:
            self.log_failure(f"Failed: {failed}")
        
        # List failures
        if failed > 0:
            self.log("\n" + "="*60, Colors.BOLD)
            self.log("❌ FAILED TESTS:", Colors.RED)
            self.log("="*60, Colors.BOLD)
            for result in self.results:
                if not result.passed:
                    self.log(f"  - {result.name}: {result.message}", Colors.RED)
        
        # Pass rate
        pass_rate = (passed / total * 100) if total > 0 else 0
        self.log(f"\n📈 Pass Rate: {pass_rate:.1f}%", Colors.BOLD)
        
        if pass_rate == 100:
            self.log("\n🎉 ALL TESTS PASSED! 🎉", Colors.GREEN)
        elif pass_rate >= 80:
            self.log("\n✅ Good! Most tests passed.", Colors.YELLOW)
        else:
            self.log("\n⚠️  Warning: Many tests failed. Review implementation.", Colors.RED)
        
        self.log("\n" + "="*60 + "\n", Colors.BOLD)

if __name__ == "__main__":
    tester = SalesGPTTester()
    tester.run_all_tests()
