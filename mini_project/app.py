from flask import Flask, request, jsonify, render_template,url_for
from sentence_transformers import SentenceTransformer, util

app = Flask(__name__)

# Load the pre-trained model
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

@app.route('/')
def home():
    return render_template('desktop1.html')

@app.route('/index')
def index_page():
    return render_template('index.html')

@app.route('/rolemain')
def rolemain():
    return render_template('rolemain.html')

@app.route('/topicmain')
def topicmain():
    return render_template('topicmain.html')

@app.route('/role1')
def role1():
    json_url = url_for('static', filename='data/rolequestions.json')
    return render_template('role1.html', json_url=json_url)

@app.route('/role2')
def role2():
    json_url = url_for('static', filename='data/role2_questions.json')
    return render_template('role2.html', json_url=json_url)

@app.route('/role3')
def role3():
    json_url = url_for('static', filename='data/role3_questions.json')
    return render_template('role3.html', json_url=json_url)

@app.route('/role4')
def role4():
    json_url = url_for('static', filename='data/role4_questions.json')
    return render_template('role4.html', json_url=json_url)

@app.route('/role5')
def role5():
    json_url = url_for('static', filename='data/role5_questions.json')
    return render_template('role5.html', json_url=json_url)


@app.route('/similarity', methods=['POST'])
def similarity():
    data = request.json
    user_answer = data['user_answer']
    optimal_answer = data['optimal_answer']

    # Encode the sentences to get their embeddings
    user_embedding = model.encode(user_answer, convert_to_tensor=True)
    optimal_embedding = model.encode(optimal_answer, convert_to_tensor=True)

    # Compute the cosine similarity
    cosine_scores = util.pytorch_cos_sim(user_embedding, optimal_embedding)

    similarity_score = float(cosine_scores[0][0])
    return jsonify({"similarity_score": similarity_score})

if __name__ == '__main__':
    app.run(debug=True)
