function recombineShares() {
    const shares = JSON.parse(document.getElementById('shares').value);
    const prime = document.getElementById('prime').value;
    const prime3217 = Decimal('2').pow(prime).sub(1);
    const recombinedsecret = combine(shares, prime3217).toHex();
    document.getElementById('recombined').value = recombinedsecret;
    
    // Compare the input secret and the recombined secret
    const secret = document.getElementById('secret').value;
    const comparisonElement = document.getElementById('comparison');
    
    if (secret === recombinedsecret) {
        comparisonElement.textContent = 'The input secret and the recombined secret are the same.';
        comparisonElement.style.color = 'green';
    } else {
        comparisonElement.textContent = 'The input secret and the recombined secret are not the same.';
        comparisonElement.style.color = 'red';
    }
}

document.addEventListener('DOMContentLoaded', function() {
    
    document.getElementById('shamirForm').addEventListener('submit', function(event) {
        event.preventDefault();
        const secret = document.getElementById('secret').value;
        const n = document.getElementById('n').value;
        const k = document.getElementById('k').value;
        const prime = document.getElementById('prime').value;
        const prime3217 = Decimal('2').pow(prime).sub(1);
        
        
        const shares = split(secret, n, k, prime3217);
        console.log(shares);
        document.getElementById('shares').value = JSON.stringify(shares, null, 2);
    });
    

});