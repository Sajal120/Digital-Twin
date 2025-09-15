#!/usr/bin/env python3
"""
Digital Twin Profile Embedding Script
=====================================

Simple script to embed the enhanced digital twin profile into Upstash Vector database.
This script reads data/mytwin.json and creates embeddings for the MCP server.
"""

import json
import os
import time
from typing import List, Dict, Any
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def embed_digital_twin():
    """Main function to embed the digital twin profile"""
    
    try:
        # Import required libraries
        from upstash_vector import Index
        import openai
        
        print("🚀 Starting Digital Twin Profile Embedding...")
        
        # Initialize connections
        vector_url = os.getenv('UPSTASH_VECTOR_REST_URL')
        vector_token = os.getenv('UPSTASH_VECTOR_REST_TOKEN')
        openai_api_key = os.getenv('OPENAI_API_KEY')
        
        if not all([vector_url, vector_token, openai_api_key]):
            print("❌ Missing required environment variables:")
            print("   - UPSTASH_VECTOR_REST_URL")
            print("   - UPSTASH_VECTOR_REST_TOKEN") 
            print("   - OPENAI_API_KEY")
            return False
        
        # Initialize clients
        openai.api_key = openai_api_key
        vector_index = Index(url=vector_url, token=vector_token)
        
        # Test connections
        vector_info = vector_index.info()
        print(f"✅ Connected to Upstash Vector - Dims: {vector_info.dimension}, Vectors: {vector_info.vector_count}")
        
        # Load digital twin data
        with open('data/mytwin.json', 'r', encoding='utf-8') as f:
            twin_data = json.load(f)
        
        print(f"📊 Loaded digital twin profile for: {twin_data['personalInfo']['name']}")
        
        # Clear existing vectors (optional - for fresh embedding)
        print("🧹 Clearing existing vectors...")
        try:
            vector_index.reset()
            print("✅ Existing vectors cleared")
        except Exception as e:
            print(f"⚠️ Could not clear vectors (may not exist): {e}")
        
        # Process content chunks for embedding
        content_chunks = twin_data.get('content_chunks', [])
        print(f"📝 Processing {len(content_chunks)} content chunks...")
        
        embedded_count = 0
        
        for i, chunk in enumerate(content_chunks):
            try:
                # Create embedding using OpenAI
                response = openai.embeddings.create(
                    model="text-embedding-ada-002",
                    input=chunk['content']
                )
                
                embedding = response.data[0].embedding
                
                # Prepare metadata
                metadata = {
                    "id": chunk['id'],
                    "type": chunk['type'], 
                    "title": chunk['title'],
                    "category": chunk['metadata'].get('category', ''),
                    "importance": chunk['metadata'].get('importance', 'medium'),
                    "tags": ','.join(chunk['metadata'].get('tags', [])),
                    "content": chunk['content'][:500] + "..." if len(chunk['content']) > 500 else chunk['content']
                }
                
                # Store in vector database
                vector_index.upsert(vectors=[{
                    "id": chunk['id'],
                    "values": embedding,
                    "metadata": metadata
                }])
                
                embedded_count += 1
                print(f"✅ Embedded chunk {i+1}/{len(content_chunks)}: {chunk['title'][:50]}...")
                
                # Rate limiting
                time.sleep(0.1)
                
            except Exception as e:
                print(f"❌ Failed to embed chunk {chunk['id']}: {e}")
                continue
        
        # Add key profile sections as additional vectors
        profile_sections = [
            {
                "id": "personal_info_summary",
                "content": f"{twin_data['personalInfo']['summary']} {twin_data['personalInfo']['elevator_pitch']}",
                "title": "Professional Summary",
                "type": "overview"
            },
            {
                "id": "salary_location_info", 
                "content": f"Location: {twin_data['salary_location']['current_location']}. Salary expectations: {twin_data['salary_location']['salary_expectations']}. Remote experience: {twin_data['salary_location']['remote_experience']}. Travel availability: {twin_data['salary_location']['travel_availability']}.",
                "title": "Salary and Location Preferences",
                "type": "logistics"
            },
            {
                "id": "technical_skills_summary",
                "content": f"Technical skills include: {', '.join([skill['name'] for skill in twin_data['skills']['technical'][0]['skills'][:10]])}. Years of experience range from 1-4 years across different technologies.",
                "title": "Technical Skills Overview", 
                "type": "skills"
            }
        ]
        
        print(f"📝 Adding {len(profile_sections)} additional profile sections...")
        
        for section in profile_sections:
            try:
                # Create embedding
                response = openai.embeddings.create(
                    model="text-embedding-ada-002",
                    input=section['content']
                )
                
                embedding = response.data[0].embedding
                
                # Store in vector database
                vector_index.upsert(vectors=[{
                    "id": section['id'],
                    "values": embedding,
                    "metadata": {
                        "id": section['id'],
                        "type": section['type'],
                        "title": section['title'],
                        "content": section['content']
                    }
                }])
                
                embedded_count += 1
                print(f"✅ Embedded: {section['title']}")
                
            except Exception as e:
                print(f"❌ Failed to embed section {section['id']}: {e}")
        
        # Final status
        final_info = vector_index.info()
        print(f"\n🎉 Digital Twin Embedding Complete!")
        print(f"✅ Successfully embedded {embedded_count} vectors")
        print(f"📊 Total vectors in database: {final_info.vector_count}")
        print(f"🎯 Your enhanced digital twin profile is ready for MCP server queries!")
        
        return True
        
    except ImportError as e:
        print(f"❌ Missing dependencies: {e}")
        print("Please install: pip install upstash-vector openai python-dotenv")
        return False
    except Exception as e:
        print(f"❌ Embedding failed: {e}")
        return False

if __name__ == "__main__":
    success = embed_digital_twin()
    exit(0 if success else 1)