import httpx, io, time, sys
from PIL import Image
client = httpx.Client(timeout=10)
base='http://127.0.0.1:8000'
print('Checking backend root...')
try:
    r = client.get(base + '/')
    print('root status', r.status_code)
except Exception as e:
    print('Backend not reachable:', e); sys.exit(1)

# login as patient
print('\nLogging in as patient...')
r = client.post(base + '/auth/login', data={'username':'patient@example.com','password':'pass'})
print('login status', r.status_code, r.text[:200])
if r.status_code!=200:
    sys.exit(1)
token_patient = r.json().get('access_token')

# upload image
print('\nUploading image as patient...')
img = Image.new('RGB',(64,64),(123,222,100))
buf = io.BytesIO(); img.save(buf,'PNG'); buf.seek(0)
files={'file':('test.png', buf, 'image/png')}
headers={'Authorization':f'Bearer {token_patient}'}
r = client.post(base + '/upload', headers=headers, files=files)
print('upload status', r.status_code)
print('upload response', r.json())
rec_id = r.json().get('id')

# login as doctor
print('\nLogging in as doctor...')
r = client.post(base + '/auth/login', data={'username':'doc@example.com','password':'pass'})
print('doctor login', r.status_code, r.text[:200])
token_doc = r.json().get('access_token')

# get pending
print('\nFetching pending records as doctor...')
r = client.get(base + '/doctor/records/pending', headers={'Authorization':f'Bearer {token_doc}'})
print('pending status', r.status_code)
print('pending list', r.json())

# find our record
pending = r.json()
ids = [p['id'] for p in pending]
print('pending ids', ids)
if rec_id not in ids:
    print('Record not found in pending; trying to fetch directly...')
    rr = client.get(base + f'/doctor/records/{rec_id}', headers={'Authorization':f'Bearer {token_doc}'})
    print('direct fetch', rr.status_code, rr.json())

# validate record
print('\nValidating record...')
r = client.post(base + f'/doctor/records/{rec_id}/validate', headers={'Authorization':f'Bearer {token_doc}', 'Content-Type':'application/json'}, json={'validated':True,'notes':'Verified by smoke test'})
print('validate status', r.status_code, r.text[:300])

# fetch record to confirm
print('\nFetching record after validate...')
r = client.get(base + f'/doctor/records/{rec_id}', headers={'Authorization':f'Bearer {token_doc}'})
print('fetch after validate', r.status_code, r.json())

# Check /auth/me for both
print('\n/me patient')
r = client.get(base + '/auth/me', headers={'Authorization':f'Bearer {token_patient}'})
print(r.status_code, r.json())
print('\n/me doctor')
r = client.get(base + '/auth/me', headers={'Authorization':f'Bearer {token_doc}'})
print(r.status_code, r.json())

print('\nSmoke test completed successfully')
