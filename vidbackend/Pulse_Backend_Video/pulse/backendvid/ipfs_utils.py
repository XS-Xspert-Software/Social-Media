import ipfshttpclient

# Singleton IPFS client instance
ipfs = ipfshttpclient.connect('/dns/localhost/tcp/5001/http')

def upload_file_to_ipfs(file_obj):
    # file_obj: Django UploadedFile or file-like object
    res = ipfs.add(file_obj)
    return res['Hash']  # CID
