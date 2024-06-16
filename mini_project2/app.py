import warnings
from flask import Flask, render_template, request, jsonify
from sentence_transformers import SentenceTransformer
from scipy.spatial import distance

# Suppress specific warnings
warnings.filterwarnings("ignore", category=FutureWarning, module="huggingface_hub.file_download")

app = Flask(__name__)

# Load the pre-trained model for computing similarity scores
model = SentenceTransformer('all-MiniLM-L6-v2')

@app.route('/')
def desktop():
    return render_template('desktop1.html')

@app.route('/index')
def index():
    return render_template('index.html')

@app.route('/about')
def about():
    return render_template('about.html')

@app.route('/rolemain')
def rolemain():
    return render_template('rolemain.html')

@app.route('/role1')
def role1():
    return render_template('role1.html')

@app.route('/role2')
def role2():
    return render_template('role2.html')

@app.route('/role3')
def role3():
    return render_template('role3.html')

@app.route('/role4')
def role4():
    return render_template('role4.html')

@app.route('/role5')
def role5():
    return render_template('role5.html')

@app.route('/topicmain')
def topicmain():
    return render_template('topicmain.html')

@app.route('/topic1')
def topic1():
    return render_template('topic1.html')

@app.route('/topic2')
def topic2():
    return render_template('topic2.html')

@app.route('/topic3')
def topic3():
    return render_template('topic3.html')

@app.route('/topic4')
def topic4():
    return render_template('topic4.html')

@app.route('/topic5')
def topic5():
    return render_template('topic5.html')

@app.route('/similarity', methods=['POST'])
def similarity():
    data = request.get_json()
    user_answer = data['user_answer']
    optimal_answer = data['optimal_answer']

    # Encode the sentences to get their embeddings
    user_answer_vec = model.encode([user_answer])[0]
    optimal_answer_vec = model.encode([optimal_answer])[0]

    # Calculate cosine similarity
    similarity_score = 1 - distance.cosine(user_answer_vec, optimal_answer_vec)

    return jsonify({
        'result': 'success',
        'similarity_score': similarity_score
    })

if __name__ == '__main__':
    app.run(debug=True)