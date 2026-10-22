import unittest
from app import app

class TestHireSenseApp(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def test_home(self):
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)

    def test_jobs_api(self):
        res = self.client.get('/api/jobs')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertGreaterEqual(len(data['jobs']), 6)

    def test_sample_profiles(self):
        res = self.client.get('/api/sample_profiles')
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertIn('frontend', data['profiles'])

    def test_parse_resume_text(self):
        res = self.client.post('/api/parse_resume', data={'resume_text': 'Arun Kumar. B.E CSE. Skills: HTML, CSS, JavaScript, React, Git, Python'})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('React', data['skills'])
        self.assertIn('HTML', data['skills'])

    def test_parse_pdf_resume(self):
        with open('sample_resumes/Sample_Resume_Arun_Kumar.pdf', 'rb') as f:
            res = self.client.post('/api/parse_resume', data={'file': f}, content_type='multipart/form-data')
            self.assertEqual(res.status_code, 200)
            data = res.get_json()
            self.assertTrue(data['success'])
            self.assertIn('React', data['skills'])

    def test_match_and_guidance(self):
        skills = ['HTML', 'CSS', 'JavaScript', 'React', 'Git']
        res = self.client.post('/api/analyze_matches', json={'skills': skills})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertGreater(data['matches'][0]['match_percentage'], 70)
        self.assertIn('roadmap', data['career_guidance'])
        self.assertIn('resume_tips', data['career_guidance'])

    def test_simulate_alert(self):
        res = self.client.post('/api/simulate_new_job', json={'user_skills': ['HTML', 'React']})
        self.assertEqual(res.status_code, 200)
        data = res.get_json()
        self.assertTrue(data['success'])
        self.assertIn('new_job', data)

if __name__ == '__main__':
    unittest.main()
